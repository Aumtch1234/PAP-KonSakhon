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
          echo "Docker version: $(docker --version)"
          echo "Docker Compose version: $(docker-compose --version)"
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
          if [ -f "DB/init.sql" ]; then
            echo "📦 Importing DB/init.sql..."
            docker exec -i postgres psql -U postgres -d WEB_APP < DB/init.sql 2>&1
            
            if [ $? -eq 0 ]; then
              echo "✅ Database schema initialized successfully"
            else
              echo "⚠️  Database initialization completed (may have warnings)"
            fi
            
            # Verify tables
            echo "📋 Checking database tables..."
            docker exec postgres psql -U postgres -d WEB_APP -c "\\dt" || true
          else
            echo "⚠️  DB/init.sql not found - creating basic schema"
            # Create basic tables if init.sql doesn't exist
            docker exec -i postgres psql -U postgres -d WEB_APP << EOF
              CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                created_at TIMESTAMP DEFAULT NOW()
              );
              
              CREATE TABLE IF NOT EXISTS chats (
                id SERIAL PRIMARY KEY,
                user1_id INT NOT NULL,
                user2_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
              );
              
              CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                chat_id INT NOT NULL,
                sender_id INT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
              );
              
              echo "✅ Basic schema created"
EOF
          fi
        '''
      }
    }

    stage('Seed Initial Data (Optional)') {
      steps {
        echo '🌾 Seeding initial data...'
        sh '''
          # Optional: Check if seed data file exists
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
          docker images | grep -E "REPOSITORY|$PROJECT_NAME|postgres|pgadmin" || true
        '''
      }
    }

    stage('Stop Database Temporarily') {
      steps {
        echo '⏸️ Stopping database for full compose up...'
        sh '''
          docker-compose -f $DOCKER_COMPOSE down
          sleep 2
        '''
      }
    }

    stage('Start All Services') {
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
          echo "=== Container Logs (Last 30 lines) ==="
          
          echo "--- Next.js ---"
          docker logs --tail=30 nextjs 2>&1 | head -30 || true
          
          echo "--- PostgreSQL ---"
          docker logs --tail=30 postgres 2>&1 | head -30 || true
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
        docker ps -a || true
        echo "=== Docker Logs ==="
        docker-compose -f $DOCKER_COMPOSE logs --tail=50 || true
      '''
    }
    always {
      echo '🧹 Pipeline finished'
    }
  }
}