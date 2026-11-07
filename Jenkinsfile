pipeline {
    agent any

    environment {
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${env.PATH}"
        DATABASE_URL = "mysql+pymysql://root:password@127.0.0.1:3307/eagle_lms"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
            }
        }

        stage('Start Database') {
            steps {
                echo 'Starting MySQL database...'

                sh '''
                    docker compose up -d db
                '''

                echo 'Waiting for MySQL to become ready...'

                sh '''
                    for i in $(seq 1 30); do
                        if docker compose exec -T db mysqladmin ping -h 127.0.0.1 -uroot -ppassword --silent; then
                            echo "MySQL is ready!"
                            exit 0
                        fi

                        echo "MySQL is not ready yet... waiting..."
                        sleep 2
                    done

                    echo "MySQL did not become ready."
                    docker compose logs db
                    exit 1
                '''
            }
        }

        stage('Backend Unit Tests') {
            steps {
                dir('backend') {

                    sh 'python3 -m venv venv'

                    sh './venv/bin/pip install -r requirements.txt'

                    sh '''
                        export DATABASE_URL="mysql+pymysql://root:password@127.0.0.1:3307/eagle_lms"
                        ./venv/bin/pytest tests/
                    '''
                }
            }
        }

        stage('Terraform Validation') {
            steps {
                dir('infra') {
                    sh 'terraform init'
                    sh 'terraform validate'
                }
            }
        }

        stage('Docker Verify Build') {
            steps {
                sh 'docker compose build'
            }
        }
    }

    post {
        always {
            echo 'Cleaning up Docker services...'
            sh 'docker compose down || true'
        }
    }
}
