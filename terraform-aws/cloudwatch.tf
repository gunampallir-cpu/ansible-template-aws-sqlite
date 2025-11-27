# CloudWatch Log Groups

resource "aws_cloudwatch_log_group" "application_backend" {
  count             = var.enable_cloudwatch_logs ? 1 : 0
  name              = "/aws/eks/${var.project_name}/backend"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-backend-logs"
    Application = "backend"
  }
}

resource "aws_cloudwatch_log_group" "application_frontend" {
  count             = var.enable_cloudwatch_logs ? 1 : 0
  name              = "/aws/eks/${var.project_name}/frontend"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-frontend-logs"
    Application = "frontend"
  }
}

# CloudWatch Log Group for Istio
resource "aws_cloudwatch_log_group" "istio" {
  count             = var.enable_cloudwatch_logs && var.enable_istio ? 1 : 0
  name              = "/aws/eks/${var.project_name}/istio"
  retention_in_days = var.log_retention_days

  tags = {
    Name        = "${var.project_name}-istio-logs"
    Application = "istio"
  }
}
