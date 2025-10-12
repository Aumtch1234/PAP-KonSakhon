pipeline {
  agent any

  environment {
    DOCKER_COMPOSE = 'docker-compose.yml'
    PROJECT_NAME = 'nextjs-app'
  }

  stages {

    stage('Checkout') {
      steps {
        echo '📥 Pulling latest code...'
        git branch: 'main', url: 'https://github.com/Aumtch1234/PAP-KonSakhon.git'
      }
    }

    stage('Build') {
      steps {
        echo '🔨 Building Docker images...'
        sh '''
          docker-compose -f $DOCKER_COMPOSE build --no-cache
        '''
      }
    }

    stage('Stop Old Containers') {
      steps {
        echo '🧹 Stopping and removing old containers...'
        sh '''
          docker-compose -f $DOCKER_COMPOSE down || true
        '''
      }
    }

    stage('Run New Containers') {
      steps {
        echo '🚀 Starting new containers...'
        // ใช้ set +e เพื่อไม่ให้ Jenkins ล้มเมื่อ container unhealthy
        sh '''
          set +e
          docker-compose -f $DOCKER_COMPOSE up -d
          EXIT_CODE=$?
          if [ $EXIT_CODE -ne 0 ]; then
            echo "⚠️ Some containers reported unhealthy or failed to start, continuing..."
          fi
          set -e
        '''
      }
    }

    stage('Health Check') {
      steps {
        echo '🔍 Checking running containers...'
        sh '''
          echo "=== Active containers ==="
          docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
          echo "=== Postgres health ==="
          docker inspect -f '{{.State.Health.Status}}' postgres || echo "postgres has no healthcheck"
          echo "=== Next.js health ==="
          docker inspect -f '{{.State.Health.Status}}' nextjs || echo "nextjs has no healthcheck"
        '''
      }
    }
  }

  post {
    success {
      echo '✅ CI/CD pipeline completed successfully!'
    }
    failure {
      echo '❌ Build failed or container setup error!'
    }
    always {
      echo '📦 Cleaning unused Docker resources...'
      sh 'docker system prune -f || true'
    }
  }
}
