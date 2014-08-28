/* global module */
module.exports = function (grunt) {
  "use strict";

  // load plugins/tasks
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  // grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-open');

  // Register tasks
  grunt.registerTask('default', [
    'build',
    // 'jasmine',
    'package'
  ]);

  grunt.registerTask('build', [
    'jshint',
    'clean:build',
    'copy:build'
  ]);

  grunt.registerTask('package', [
    'clean:package',
    'concat:package',
    'uglify:package'
  ]);

  grunt.registerTask('workflow:dev', [
    'connect:dev',
    'build',
    'open:dev',
    'watch:dev',
  ]);

  // Configure
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    env: grunt.option('env') || 'dev',

    project: {
      name: 'resources-q',
      source_dir: 'src',
      build_dir: 'build',
      test_dir: 'test',
      package_dir: 'dist',
    },

    clean: {
      build:   '<%= project.build_dir %>',
      package: '<%= project.package_dir %>'
    },

    jshint: {
      source: [
        '<%= project.source_dir %>/js/**/*.js'
      ],
      test: [
        '<%= project.test_dir %>/**/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    copy: {
      build: {
        files: [
          {
            expand: true,
            cwd: '<%= project.source_dir %>',
            src: ['**'],
            dest: '<%= project.build_dir %>'
          }
        ]
      }
    },

    // jasmine: {
    //   test:  {
    //     src: '<%= project.source_dir %>/js/**/*.js',
    //     options: {
    //       specs: '<%= project.test_dir %>/*.spec.js'
    //     }
    //   }
    // },

    concat: {
      options: {
        stripBanners: true
      },
      package: {
        src: ["<%= project.build_dir %>/js/<%= project.name %>.js"],
        dest: "<%= project.package_dir %>/<%= project.name %>.js"
      }
    },

    uglify: {
      package: {
        files: {
          '<%= project.package_dir %>/<%= project.name %>.min.js':
            '<%= project.package_dir %>/<%= project.name %>.js'
        }
      },
      options: {
        beautify: {
          "ascii_only": true
        },
        banner:
          "/*!\n" +
          " *AssetManager Q v<%= pkg.version %>\n" +
          " */\n",
        compress: {
          "hoist_funs": false,
          loops: false,
          unused: false
        }
      }
    },

    bump: {
      options: {
        files:
          ['bower.json', 'package.json'],
        commitFiles:
          ['bower.json', 'package.json']
      }
    },

    connect: {
      options: {
        hostname: '*'
      },
      dev: {
        options: {
          port: 9000,
          base: '<%= project.build_dir %>'
        }
      }
    },

    open: {
      dev: {
        url: 'http://127.0.0.1:<%= connect.dev.options.port %>/demo.html'
      }
    },

    watch: {
      dev: {
        files: ['<%= project.source_dir %>/**/*'],
        tasks: ['build', /*'jasmine' */],
        options: {
          livereload: true
        }
      }
    }

  });
};
