'use strict'
var util = require('util');
var path = require('path');
var chalk = require('chalk');
var yeoman = require('yeoman-generator');
var globule = require('globule');
var shelljs = require('shelljs');

var JekyllizedGenerator = yeoman.generators.Base.extend({
    init: function () {

        var dependenciesInstalled = ['bundle', 'ruby'].every(function (depend) {
            return shelljs.which(depend);
        });

        if (!dependenciesInstalled) {
            this.log('MISSING DEPENDENCIES:' +
                '\nEither ' + chalk.white('Ruby') + ' or ' + chalk.white('Bundler') + ' is not installed or missing from $PATH.' +
                '\nMake sure that they are either installed or added to $PATH.');
            shelljs.exit(1);
        };

        this.testFramework = this.options['test-framework'] || 'mocha';

        this.on('end', function () {
            if (!this.options['skip-install']) {
                this.spawnCommand('bundle', ['install']);
                this.installDependencies();
            }
        });

        this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
    },

    projectPrompting: function () {
        var cb = this.async();

        this.log(this.yeoman);
        this.log('\n' + 
            chalk.blue('     ____        ___                 ___ ___')  + chalk.yellow('                            ___\n') + 
            chalk.blue('     `MM         `MM                 `MM `MM')  + chalk.yellow(' 68b                        `MM\n') +
            chalk.blue('      MM          MM                  MM  MM')  + chalk.yellow(' Y89                         MM\n') +
            chalk.blue('      MM   ____   MM   __ ____    ___ MM  MM')  + chalk.yellow(' ___ _________  ____     ____MM\n') +
            chalk.blue('      MM  6MMMMb  MM   d` `MM(    )M` MM  MM')  + chalk.yellow(' `MM MMMMMMMMP 6MMMMb   6MMMMMM\n') +
            chalk.blue('      MM 6M`  `Mb MM  d`   `Mb    d`  MM  MM')  + chalk.yellow('  MM /    dMP 6M`  `Mb 6M`  `MM\n') +
            chalk.blue('      MM MM    MM MM d`     YM.  ,P   MM  MM')  + chalk.yellow('  MM     dMP  MM    MM MM    MM\n') +
            chalk.blue('      MM MMMMMMMM MMdM.      MM  M    MM  MM')  + chalk.yellow('  MM    dMP   MMMMMMMM MM    MM\n') +
            chalk.blue('(8)   MM MM       MMPYM.     `Mbd`    MM  MM')  + chalk.yellow('  MM   dMP    MM       MM    MM\n') +
            chalk.blue('((   ,M9 YM    d9 MM  YM.     YMP     MM  MM')  + chalk.yellow('  MM  dMP    /YM    d9 YM.  ,MM\n') +
            chalk.blue(' YMMMM9   YMMMM9 _MM_  YM._    M     _MM__MM')  + chalk.yellow('__MM_dMMMMMMMM YMMMM9   YMMMMMM_\n') +
            chalk.blue('                              d`            ')  + chalk.yellow('\n') +
            chalk.blue('                          (8),P             ')  + chalk.yellow('\n') +
            chalk.blue('                           YMM              ')  + chalk.yellow('\n')
        );

        this.log(chalk.magenta('\nIt\'s time to get Jekyllized!'));
        this.log(chalk.yellow('\nTell me a little about your project »'));

        var prompts = [{
            name: 'projectName',
            message: 'What is the name of your project?'
        }, {
            name: 'projectDescription',
            message: 'Describe your project for me:'
        }, {
            name: 'projectTagline',
            message: 'What is the tagline for your project?'
        }, {
            name: 'projectUrl',
            message: 'What will the URL for your project be?'
        }];

        this.prompt(prompts, function (props) {
            this.projectName        = props.projectName;
            this.projectDescription = props.projectDescription;
            this.projectTagline     = props.projectTagline;
            this.projectUrl         = props.projectUrl;

            cb();
        }.bind(this));
    },

    ownerPrompting: function () {
        var cb = this.async();

        this.log(chalk.yellow('\nNow it\'s time to tell me about you. »'));

        var prompts = [{
            name: 'ownerName',
            message: 'What is your name?',
        }, {
            name: 'ownerEmail',
            message: 'What is your email?',
        }, {
            name: 'ownerBio',
            message: 'Write a short description of yourself:'
        }, {
            name: 'ownerTwitter',
            message: 'Your Twitter URL:'
        }];

        this.prompt(prompts, function (props) {
            this.ownerName      = props.ownerName;
            this.ownerEmail     = props.ownerEmail;
            this.ownerBio       = props.ownerBio;
            this.ownerTwitter   = props.ownerTwitter;

            cb();
        }.bind(this));
    },

    jekyllPrompting: function () {
        var cb = this.async();

        this.log(chalk.yellow('\nNow on to set some Jekyll settings: »') +
                chalk.red('\nYou can change all of this later in the _config.yml file'));

        var prompts = [{
            name: 'jekyllPermalinks',
            type: 'list',
            message: 'Permalink style' +
                (chalk.red(
                           '\n  pretty: /:categories:/:year/:month/:day/:title/' +
                           '\n  date:   /:categories/:year/:month/:day/:title.html' +
                           '\n  none:   /:categories/:title.html')),
            choices: ['pretty', 'date', 'none']
        }, {
            name: 'jekyllPaginate',
            message: 'How many posts do you want to show on your front page?',
            default: 10,
            validate: function (input) {
                if (/^[0-9]*$/.test(input)) {
                    return true;
                }
                if (/^all*$/i.test(input)) {
                    return true;
                }
                return 'Must be a number or \'all\'';
            }
        }];

        this.prompt(prompts, function (props) {
            this.jekyllPermalinks   = props.jekyllPermalinks;
            this.jekyllPaginate     = /^all$/i.test(props.jekyllPaginate) ? false: props.jekyllPaginate;

            cb();
        }.bind(this));
    },

    scaffolding: function () {
        this.copy('Gemfile', 'Gemfile');
        this.copy('bowerrc', '.bowerrc');
        this.copy('_bower.json', 'bower.json');
        this.template('_package.json', 'package.json');
        this.template('_config.yml', '_config.yml');
        this.template('_config.build.yml', '_config.build.yml');
        this.template('_README.md', 'README.md');
        this.copy('gulpfile.js', 'gulpfile.js');
        this.copy('gitignore', '.gitignore');
        this.copy('gitattributes', 'gitattributes');
        this.copy('jshintrc', '.jshintrc');
        this.copy('editorconfig', '.editorconfig');
    },
    
    jekyll: function () {
        this.directory('app', 'src');
    }
});

module.exports = JekyllizedGenerator;
