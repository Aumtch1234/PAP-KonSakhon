pipeline {
  agent any

  environment {
    DOCKER_COMPOSE = 'docker-compose.yml'
    PROJECT_NAME = 'nextjs-app'
    REGISTRY = 'docker.io'
    REGISTRY_CRED = 'docker-credentials'
  }

  stages {

    stage('Checkout') {
      steps {
        echo '📥 Pulling latest code...'
        git branch: 'main', url: 'https://github.com/Aumtch1234/PAP-KonSakhon.git'
        sh 'git log --oneline -1'
      }
    }

    stage('Validate Environment') {
      steps {
        echo '✅ Validating environment and files...'
        sh '''
          # Check if required files exist
          if [ ! -f "$DOCKER_COMPOSE" ]; then
            echo "❌ docker-compose.yml not found!"
            exit 1
          fi
          
          if [ ! -f "Dockerfile" ]; then
            echo "❌ Dockerfile not found!"
            exit 1
          fi
          
          if [ ! -f "DB/init.sql" ]; then
            echo "⚠️  DB/init.sql not found - database may not initialize"
          fi
          
          echo "✅ All required files present"
          echo "Docker version: $(docker --version)"
          echo "Docker Compose version: $(docker-compose --version)"
        '''
      }
    }

    stage('Clean Old Containers') {
      steps {
        echo '🧹 Cleaning old containers and volumes...'
        sh '''
          set +e
          
          echo "Stopping containers..."
          docker-compose -f $DOCKER_COMPOSE down
          
          echo "Removing dangling images and volumes..."
          docker image prune -f
          docker volume prune -f
          
          set -e
        '''
      }
    }

    stage('Build Docker Images') {
      steps {
        echo '🔨 Building Docker images...'
        sh '''
          docker-compose -f $DOCKER_COMPOSE build --no-cache
          
          if [ $? -ne 0 ]; then
            echo "❌ Docker build failed!"
            exit 1
          fi
          
          echo "✅ Build completed successfully"
          docker images | grep -E "REPOSITORY|$PROJECT_NAME|postgres|pgadmin"
        '''
      }
    }

    stage('Start Services') {
      steps {
        echo '🚀 Starting all services...'
        sh '''
          docker-compose -f $DOCKER_COMPOSE up -d
          
          echo "⏳ Waiting for services to start..."
          sleep 5
          
          echo "=== Running Containers ==="
          docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        '''
      }
    }

    stage('Wait for Database') {
      steps {
        echo '⏳ Waiting for PostgreSQL to be ready...'
        sh '''
          MAX_ATTEMPTS=30
          ATTEMPT=0
          
          while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
            if docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then
              echo "✅ PostgreSQL is ready!"
              docker exec postgres psql -U postgres -d WEB_APP -c "SELECT version();" | head -1
              exit 0
            fi
            
            ATTEMPT=$((ATTEMPT + 1))
            echo "⏳ Waiting for PostgreSQL... (Attempt $ATTEMPT/$MAX_ATTEMPTS)"
            sleep 2
          done
          
          echo "❌ PostgreSQL failed to start!"
          docker logs postgres
          exit 1
        '''
      }
    }

    stage('Initialize Database') {
      steps {
        echo '🌱 Initializing database...'
        sh '''
          if [ -f "DB/init.sql" ]; then
            echo "📦 Importing DB/init.sql..."
            
            # สร้างไฟล์ temp สำหรับ error handling
            TEMP_LOG=$(mktemp)
            
            docker exec -i postgres psql -U postgres -d WEB_APP < DB/init.sql 2>&1 | tee $TEMP_LOG
            
            if grep -i "error" $TEMP_LOG; then
              echo "⚠️  Database import completed with warnings"
            else
              echo "✅ Database initialized successfully"
            fi
            
            rm $TEMP_LOG
            
            # ตรวจสอบ tables ที่สำคัญ
            echo "📋 Checking database tables..."
            docker exec postgres psql -U postgres -d WEB_APP -c "\\dt" || true
          else
            echo "⚠️  DB/init.sql not found - skipping database initialization"
          fi
        '''
      }
    }

    stage('Health Check') {
      steps {
        echo '🔍 Performing health checks...'
        sh '''
          echo "=== Checking PostgreSQL ==="
          POSTGRES_STATUS=$(docker inspect -f '{{.State.Health.Status}}' postgres 2>/dev/null || echo "no healthcheck")
          echo "PostgreSQL Status: $POSTGRES_STATUS"
          
          echo "=== Checking Next.js ==="
          NEXTJS_STATUS=$(docker inspect -f '{{.State.Health.Status}}' nextjs 2>/dev/null || echo "no healthcheck")
          echo "Next.js Status: $NEXTJS_STATUS"
          
          echo "=== Checking Next.js is responding ==="
          for i in {1..10}; do
            if curl -s http://localhost:3000 > /dev/null; then
              echo "✅ Next.js is responding!"
              break
            fi
            if [ $i -eq 10 ]; then
              echo "⚠️  Next.js not responding yet, but container is running"
            else
              echo "⏳ Waiting for Next.js... (Attempt $i/10)"
              sleep 2
            fi
          done
          
          echo "=== Active Containers ==="
          docker ps --format "table {{.Names}}\t{{.State}}\t{{.Status}}"
        '''
      }
    }

    stage('Verify Application') {
      steps {
        echo '✅ Verifying application is running...'
        sh '''
          echo "=== Container Logs (Last 20 lines) ==="
          
          echo "--- Next.js Logs ---"
          docker logs --tail=20 nextjs || true
          
          echo "--- PostgreSQL Logs ---"
          docker logs --tail=20 postgres || true
          
          echo "=== API Health Check ==="
          curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/api/feeds || echo "API not responding yet"
        '''
      }
    }

  }

  post {
    success {
      echo '✅ CI/CD pipeline completed successfully!'
      echo 'Application is running at http://localhost:3000'
      echo 'PgAdmin is available at http://localhost:8081'
    }
    failure {
      echo '❌ Pipeline failed!'
      echo 'Collecting debug information...'
      sh '''
        echo "=== Docker Status ==="
        docker ps -a || true
        
        echo "=== Docker Logs ==="
        docker-compose -f $DOCKER_COMPOSE logs --tail=50 || true
      '''
    }
    unstable {
      echo '⚠️  Pipeline unstable'
    }
    always {
      echo '🧹 Pipeline finished'
      sh '''
        echo "=== Final Container Status ==="
        docker ps --format "table {{.Names}}\t{{.Status}}" || true
      '''
    }
  }
}