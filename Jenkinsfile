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
        echo '🐳 Building images using docker-compose...'
        sh 'docker compose -f $DOCKER_COMPOSE build'
      }
    }

    stage('Stop Old Containers') {
      steps {
        echo '🧹 Stopping and removing old containers...'
        sh 'docker compose -f $DOCKER_COMPOSE down'
      }
    }

    stage('Run New Containers') {
      steps {
        echo '🚀 Starting new containers...'
        sh 'docker compose -f $DOCKER_COMPOSE up -d'
      }
    }

    stage('Health Check') {
      steps {
        echo '🔍 Checking if containers are healthy...'
        sh '''
          docker ps
          docker inspect -f '{{.State.Health.Status}}' postgres
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
  }
}
