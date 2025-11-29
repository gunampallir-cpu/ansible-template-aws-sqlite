# EKS Node Diagnostics Script
# Run this to diagnose why nodes aren't joining the cluster

$ClusterName = "ansible-template-eks"
$Region = "us-east-1"

Write-Host "=== EKS Cluster Status ===" -ForegroundColor Cyan
aws eks describe-cluster --name $ClusterName --region $Region --query 'cluster.{Name:name,Status:status,Version:version}' --output table

Write-Host "`n=== Node Groups ===" -ForegroundColor Cyan
$NodeGroups = aws eks list-nodegroups --cluster-name $ClusterName --region $Region --query 'nodegroups[]' --output text
Write-Host "Node Groups: $NodeGroups"

foreach ($NodeGroup in $NodeGroups -split '\s+') {
    if ($NodeGroup) {
        Write-Host "`n=== Node Group: $NodeGroup ===" -ForegroundColor Yellow
        aws eks describe-nodegroup --cluster-name $ClusterName --nodegroup-name $NodeGroup --region $Region --query 'nodegroup.{Status:status,Desired:scalingConfig.desiredSize,Min:scalingConfig.minSize,Max:scalingConfig.maxSize,InstanceTypes:instanceTypes,Health:health.issues}' --output table
        
        Write-Host "`nLabels:"
        aws eks describe-nodegroup --cluster-name $ClusterName --nodegroup-name $NodeGroup --region $Region --query 'nodegroup.labels' --output json
    }
}

Write-Host "`n=== EC2 Instances for Node Group ===" -ForegroundColor Cyan
aws ec2 describe-instances --region $Region `
    --filters "Name=tag:eks:cluster-name,Values=$ClusterName" "Name=instance-state-name,Values=running,pending,stopping,stopped" `
    --query 'Reservations[].Instances[].[InstanceId,State.Name,InstanceType,PrivateIpAddress,LaunchTime,Tags[?Key==`eks:nodegroup-name`].Value | [0]]' `
    --output table

Write-Host "`n=== Kubernetes Nodes ===" -ForegroundColor Cyan
kubectl get nodes -o wide

Write-Host "`n=== Node Group Auto Scaling Group ===" -ForegroundColor Cyan
$AsgName = aws eks describe-nodegroup --cluster-name $ClusterName --nodegroup-name ($NodeGroups -split '\s+')[0] --region $Region --query 'nodegroup.resources.autoScalingGroups[0].name' --output text
if ($AsgName) {
    Write-Host "ASG Name: $AsgName"
    aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $AsgName --region $Region --query 'AutoScalingGroups[0].{Desired:DesiredCapacity,Min:MinSize,Max:MaxSize,Current:Instances[].InstanceId | length(@)}' --output table
    
    Write-Host "`nASG Activity:"
    aws autoscaling describe-scaling-activities --auto-scaling-group-name $AsgName --region $Region --max-records 5 --query 'Activities[].[StartTime,Description,Cause,StatusCode]' --output table
}

Write-Host "`n=== Recommendations ===" -ForegroundColor Green
if (-not $NodeGroups) {
    Write-Host "NO NODE GROUPS FOUND! Run: terraform apply" -ForegroundColor Red
} else {
    Write-Host "Node group exists"
    $NodeCount = 0
    try {
        $NodesOutput = kubectl get nodes 2>$null
        if ($NodesOutput) {
            $NodeCount = ($NodesOutput | Measure-Object -Line).Lines - 1
        }
    } catch {
        $NodeCount = 0
    }
    
    if ($NodeCount -le 0) {
        Write-Host "NO NODES REGISTERED! Check:" -ForegroundColor Red
        Write-Host "  1. Node IAM role has AmazonEKSWorkerNodePolicy"
        Write-Host "  2. Security groups allow node-to-control-plane traffic"
        Write-Host "  3. Check ASG activity for launch failures"
        Write-Host "  4. Verify subnet has available IPs"
    } else {
        Write-Host "Nodes are registered: $NodeCount" -ForegroundColor Green
    }
}
