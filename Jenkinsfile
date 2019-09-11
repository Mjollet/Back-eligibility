#!/usr/bin/env groovy

node {
// SAMS Eligibility
// sebastien.cavecchi@gekko.fr

    def timestamp = sh(script: "date +%Y%m%d%H%M%S", returnStdout: true).trim()
    def current_branch = env.BRANCH_NAME
    def current_tag = env.TAG_NAME
    def aws_env = ""

	println "This Branch is: $current_branch"
	println "This Tag is: $current_tag"

    switch(current_branch) {
        case "staging":
            aws_env = "STAGING"
            break
        case "develop":
            aws_env = "DEV"
            break
        case "master":
            aws_env = "PPR"
            break
        case ~/^uat.*/:
            aws_env = "UAT"
            break
        case ~/^pat.*/:
            aws_env = "PAT"
            break
        case ~/^training.*/:
            aws_env = "TRN"
            break
	case ~/^fix.*/:
            aws_env = "FIX"
            break
    }

        stage('checkout') {
            checkout scm
            //properties([pipelineTriggers([githubPush()])])
        }
        try {
	    println "This Branch $current_branch is automatically build by the CI on AWS/$aws_env"
            if (aws_env.equals("STAGING")) {
                stage("update AWS/$aws_env") {
                    println "Current Branch/Tag: $current_branch build $aws_env environment"
                    build(job: "../../$aws_env/Jobs/deploy_lambda_sams_eligibility")
                }
            }
            else if (aws_env.equals("UAT")) {
                stage("update AWS/$aws_env") {
                    println "Current Branch/Tag: $current_branch build $aws_env environment"
                    build(job: "../../$aws_env/Jobs/sams_eligibility",
                        parameters: [
                            string(name: 'lambda_git_branch', value: String.valueOf(current_branch)),
                            string(name: 'lambda_stage', value: String.valueOf(current_branch))
                        ]
                    )
                }
            }
            else if (aws_env.equals("PAT")) {
                stage("update AWS/$aws_env") {
                    println "Current Branch/Tag: $current_branch build $aws_env environment"
                    build(job: "../../$aws_env/Jobs/sams_eligibility",
                            parameters: [
                                    string(name: 'lambda_git_branch', value: String.valueOf(current_branch)),
                                    string(name: 'lambda_stage', value: String.valueOf(current_branch))
                            ]
                    )
                }
            }
            else if (aws_env.equals("TRN")) {
                stage("update AWS/$aws_env") {
                    println "Current Branch/Tag: $current_branch build $aws_env environment"
                    build(job: "../../$aws_env/Jobs/sams_eligibility",
                            parameters: [
                                    string(name: 'lambda_git_branch', value: String.valueOf(current_branch)),
                                    string(name: 'lambda_stage', value: String.valueOf(current_branch))
                            ]
                    )
                }
            }
            else if (aws_env.equals("PPR")) {
                stage("update AWS/$aws_env") {
                    println "Current Branch/Tag: $current_branch build $aws_env environment"
                    build(job: "../../$aws_env/Jobs/sams_eligibility",
                            parameters: [
                                    string(name: 'lambda_git_branch', value: String.valueOf(current_branch)),
                                    string(name: 'lambda_stage', value: String.valueOf(current_branch))
                            ]
                    )
                }
            }
            else if (aws_env.equals("DEV")) {
                stage("update AWS/$aws_env") {
                    println "Current Branch/Tag: $current_branch build $aws_env environment"
                    build(job: "../../$aws_env/Jobs/sams_eligibility",
                            parameters: [
                                    string(name: 'lambda_git_branch', value: String.valueOf(current_branch)),
                                    string(name: 'lambda_stage', value: String.valueOf(current_branch))
                            ]
                    )
                }
            }
	    else if (aws_env.equals("FIX")) {
                stage("update AWS/$aws_env") {
                    println "Current Branch/Tag: $current_branch build $aws_env environment"
                    build(job: "../../$aws_env/Jobs/sams_eligibility",
                            parameters: [
                                    string(name: 'lambda_git_branch', value: String.valueOf(current_branch)),
                                    string(name: 'lambda_stage', value: String.valueOf(current_branch))
                            ]
                    )
                }
            }
            else {
                println "This Branch $current_branch is not automatically build by the CI"
            }
        }
        catch(e) {
            currentBuild.result = 'FAILURE'
            throw e
        }

}

