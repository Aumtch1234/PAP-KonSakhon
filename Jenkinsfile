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
        sh 'git log --oneline -1'
      }
    }

    stage('Validate Environment') {
      steps {
        echo '✅ Validating environment and files...'
        sh '''
          if [ ! -f "$DOCKER_COMPOSE" ]; then
            echo "❌ docker-compose.yml not found!"
            exit 1
          fi
          
          if [ ! -f "Dockerfile" ]; then
            echo "❌ Dockerfile not found!"
            exit 1
          fi
          
          if [ ! -f "DB/init.sql" ]; then
            echo "⚠️  DB/init.sql not found"
          fi
          
          echo "✅ All required files present"
        '''
      }
    }

    stage('Clean Old Resources') {
      steps {
        echo '🧹 Cleaning old containers and volumes...'
        sh '''
          set +e
          docker-compose -f $DOCKER_COMPOSE down -v
          docker image prune -f
          docker volume prune -f
          set -e
        '''
      }
    }

    stage('Start Database Only') {
      steps {
        echo '🗄️ Starting PostgreSQL only...'
        sh '''
          docker-compose -f $DOCKER_COMPOSE up -d postgres
          
          echo "⏳ Waiting for PostgreSQL to be ready..."
          MAX_ATTEMPTS=30
          ATTEMPT=0
          
          while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
            if docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then
              echo "✅ PostgreSQL is ready!"
              break
            fi
            
            ATTEMPT=$((ATTEMPT + 1))
            echo "⏳ Waiting... (Attempt $ATTEMPT/$MAX_ATTEMPTS)"
            sleep 2
          done
          
          if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo "❌ PostgreSQL failed to start!"
            docker logs postgres
            exit 1
          fi
        '''
      }
    }

    stage('Initialize Database Schema') {
      steps {
        echo '🌱 Initializing database schema...'
        sh '''
          echo "⏳ Waiting for PostgreSQL to be fully ready..."
          sleep 10
          
          # ตรวจสอบ database WEB_APP มีอยู่หรือไม่
          if docker exec postgres psql -U postgres -lqt | cut -d '|' -f 1 | grep -qw WEB_APP; then
            echo "✅ Database WEB_APP exists"
          else
            echo "⚠️  Database WEB_APP not found, creating..."
            docker exec postgres psql -U postgres -c "CREATE DATABASE WEB_APP;" || true
          fi
          
          # Import SQL
          if [ -f "DB/init.sql" ]; then
            echo "📦 Importing DB/init.sql ($(wc -l < DB/init.sql) lines)..."
            docker exec -i postgres psql -U postgres -d WEB_APP < DB/init.sql
            
            if [ $? -eq 0 ]; then
              echo "✅ Database schema initialized successfully"
            else
              echo "❌ Database import failed"
              exit 1
            fi
            
            # Verify tables
            echo "📋 Database tables:"
            docker exec postgres psql -U postgres -d WEB_APP -c "\\dt"
          else
            echo "❌ DB/init.sql not found!"
            exit 1
          fi
        '''
      }
    }

    stage('Seed Initial Data (Optional)') {
      steps {
        echo '🌾 Seeding initial data...'
        sh '''
          if [ -f "DB/seed.sql" ]; then
            echo "📦 Importing seed data..."
            docker exec -i postgres psql -U postgres -d WEB_APP < DB/seed.sql
            echo "✅ Seed data imported"
          else
            echo "ℹ️  No seed.sql file found - skipping"
          fi
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
        '''
      }
    }

    stage('Start All Services') {
      steps {
        echo '🚀 Starting all services...'
        sh '''
          # Stop only app services, keep postgres running with data
          docker-compose -f $DOCKER_COMPOSE stop pgadmin nextjs || true
          docker-compose -f $DOCKER_COMPOSE rm -f pgadmin nextjs || true
          
          # Start all services (postgres already running with data)
          docker-compose -f $DOCKER_COMPOSE up -d
          
          echo "⏳ Waiting for services to start..."
          sleep 5
          
          echo "=== Running Containers ==="
          docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        '''
      }
    }

    stage('Wait for Services') {
      steps {
        echo '⏳ Waiting for all services to be healthy...'
        sh '''
          MAX_ATTEMPTS=30
          ATTEMPT=0
          
          echo "Waiting for PostgreSQL..."
          while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
            if docker exec postgres pg_isready -U postgres > /dev/null 2>&1; then
              echo "✅ PostgreSQL is ready!"
              break
            fi
            ATTEMPT=$((ATTEMPT + 1))
            sleep 2
          done
          
          if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo "❌ PostgreSQL failed!"
            exit 1
          fi
          
          echo "⏳ Waiting for Next.js to start..."
          ATTEMPT=0
          while [ $ATTEMPT -lt 20 ]; do
            if curl -s http://localhost:3000 > /dev/null 2>&1; then
              echo "✅ Next.js is ready!"
              break
            fi
            ATTEMPT=$((ATTEMPT + 1))
            echo "⏳ Attempt $ATTEMPT/20"
            sleep 3
          done
        '''
      }
    }

    stage('Health Check') {
      steps {
        echo '🔍 Performing health checks...'
        sh '''
          echo "=== Container Status ==="
          docker ps --format "table {{.Names}}\t{{.State}}\t{{.Status}}"
          
          echo "=== PostgreSQL Health ==="
          docker exec postgres psql -U postgres -d WEB_APP -c "SELECT version();" | head -1 || echo "Unable to connect"
          
          echo "=== Next.js API Check ==="
          curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000/ || echo "Not responding"
        '''
      }
    }

    stage('Verify Application') {
      steps {
        echo '✅ Verifying application...'
        sh '''
          echo "=== Application Status ==="
          echo "Next.js: http://localhost:3000"
          echo "PgAdmin: http://localhost:8081"
          echo ""
          
          echo "Container Logs (Last 20 lines):"
          echo "--- Next.js ---"
          docker logs --tail=20 nextjs 2>&1 || true
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
      sh '''
        echo "=== Debug Information ==="
        docker ps -a
        echo "=== Last Docker Logs ==="
        docker-compose -f $DOCKER_COMPOSE logs --tail=100 || true
      '''
    }
    always {
      echo '🧹 Pipeline finished'
    }
  }
}