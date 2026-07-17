pipeline {
    agent any

    environment {
        // Adjust PATH to find brew packages (like python3, terraform, docker) on macOS
        PATH = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${env.PATH}"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
            }
        }

        stage('Backend Unit Tests') {
            steps {
                dir('backend') {
                    sh 'python3 -m venv venv'
                    sh './venv/bin/pip install -r requirements.txt'
                    sh './venv/bin/pytest tests/'
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
}
