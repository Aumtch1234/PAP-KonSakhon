pipeline {
  agent any

  environment {
    DOCKER_COMPOSE = 'docker-compose.yml'
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
        echo '🐳 Building docker images...'
        sh 'docker-compose -f $DOCKER_COMPOSE build'
      }
    }

    stage('Run Containers') {
      steps {
        echo '🚀 Starting containers...'
        sh 'docker-compose -f $DOCKER_COMPOSE up -d'
      }
    }

    stage('Health Check') {
      steps {
        echo '🔍 Checking running containers...'
        sh 'docker ps'
      }
    }
  }

  post {
    success {
      echo '✅ Build & Deploy completed successfully!'
    }
    failure {
      echo '❌ Build failed!'
    }
  }
}
