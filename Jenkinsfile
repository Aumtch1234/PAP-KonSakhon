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
        echo '🚀 Starting all containers...'
        // ใช้ set +e เพื่อไม่ให้ Jenkins fail ทันทีถ้ามี unhealthy container
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

    stage('Deploy Web App') {
      steps {
        echo '🌐 Deploying Next.js container...'
        sh '''
          # ถ้ายังไม่มี nextjs container ให้รันใหม่
          if [ "$(docker ps -q -f name=nextjs)" = "" ]; then
            echo "🚀 Starting Next.js web app..."
            docker-compose up -d nextjs
          else
            echo "✅ Next.js already running."
          fi
          docker ps --filter "name=nextjs"
        '''
      }
    }
    stage('Seed Database') {
      steps {
        echo '🌱 Seeding database with initial data...'
        sh '''
          # รอให้ Postgres พร้อมแน่ๆ ก่อน import
          echo "⏳ Waiting for Postgres to be ready..."
          sleep 5
          # ตรวจสอบว่าไฟล์ init.sql อยู่จริง
          if [ -f "DB/init.sql" ]; then
            echo "📦 Importing DB/init.sql into Postgres..."
            docker exec -i postgres psql -U postgres -d WEB_APP < DB/init.sql
            echo "✅ Database seeding completed!"
          else
            echo "⚠️  DB/init.sql not found! Skipping import."
          fi
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
      echo '🧹 Cleaning Docker build cache only (keep containers alive)...'
      sh 'docker builder prune -f || true'
    }
  }
}
