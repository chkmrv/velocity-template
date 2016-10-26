'use strict';

// -----------------------------------------------------------------------------
// Dependencies
// -----------------------------------------------------------------------------

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require("gulp-babel");
var rename = require("gulp-rename");
var requirejs = require("gulp-requirejs-optimize");
var args = require("yargs").argv;
var path = require("path");
var uglify = require("gulp-uglify");
var fs = require("fs");
var concat = require("gulp-concat");
var include = require("gulp-include");
var browserify = require('gulp-browserify');

var replace = require('gulp-replace');
var insert = require('gulp-insert');


/*
var grepper = require("./grepper");
var transFormatter = require("./transFormatter");
var transMissing = require("./transMissing");
var autoprefixer = require('gulp-autoprefixer');
var mergeStream = require("merge-stream");*/

//
//	Helper funcs
//
function getFolders(dir, excluded, included) {
	var excluded = excluded || [];
	var included = included || null;
	return fs.readdirSync(dir)
		.filter(function (file) {
			if (included)
				return (included.indexOf(file) !== -1) && fs.statSync(path.join(dir, file)).isDirectory();
			else
				return (excluded.indexOf(file) === -1) && fs.statSync(path.join(dir, file)).isDirectory()
		});
}





//	Bundle single form
gulp.task('build-form', ['copy-library', 'build-form-only']);

gulp.task("build-form-only", ['build-form-only-conf'], function () {
	var portletName = args["portlet-name"];
	var portletsPath = "./";
	var portletDir = portletsPath + "/" + portletName + "/src/main/webapp/js/";
	return gulp.src(portletDir + "bundle.js")
		.pipe(include())
		//.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(rename(function (path) {
			path.basename = "main";
		}))
		.pipe(gulp.dest(portletDir))
		.pipe(requirejs({
			optimize: 'none',
			paths: {'react': 'empty:',
				'react-dom': 'empty:',
				'moment': 'empty:'}
		}))
		.pipe(replace("define('main", "define('" + portletName))
		.pipe(insert.append('require(["' + portletName + '"], function () {});'))
		//.pipe(browserify())
		//.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(portletDir ));
});


gulp.task("build-form-only-conf", ["build-specific-components"], function () {
	var portletName = args["portlet-name"];
	var portletsPath = "./";
	var portletDir = portletsPath + "/" + portletName + "/src/main/webapp/js/";
	return gulp.src(portletDir + "bundle-conf.js")
		.pipe(include())
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(rename(function (path) {
			path.basename = "main-conf";
		}))
		.pipe(gulp.dest(portletDir))
		.pipe(requirejs({
			optimize: 'none',
			paths: {'react': 'empty:',
				'react-dom': 'empty:',
				'moment': 'empty:'}
		}))
		.pipe(replace("define('main", "define('" + portletName))
		.pipe(insert.append('require(["' + portletName + '-conf"], function () {});'))
		//.pipe(browserify())
		.pipe(sourcemaps.write("."))
		.pipe(gulp.dest(portletDir ));
});



//
//	Compile all form-specific components (subtask)
//
gulp.task("build-specific-components", ["build-generic-components"], function () {
	var portletPath = "./";
	return gulp.src(portletPath + "/**/src/main/webapp/js/specificComponents/*.js")

		.pipe(babel())
		.pipe(rename(function (fPath) {
			fPath.dirname = path.join(fPath.dirname, "dist");
		}))
		.pipe(gulp.dest("./"));
});

//
//Compile generic components (subtask)
//
gulp.task("build-generic-components", function () {
var portletPath = "./components";
return gulp.src(portletPath + "/*.js")
	.pipe(babel())
	.pipe(gulp.dest(portletPath + "/dist"));
});

gulp.task('copy-library', function() {
	var portletPath = "./";
	var portlets = ['rrwebLifeSituations-portlet', 'rrwebContactMaps-portlet', 'rrwebFrequentlyAskedQuestions-portlet'];

	portlets.map(function cloneLibrary(portlet) {
		return gulp.src('./common/library.js')
			.pipe(include())
			.pipe(babel())
			.pipe(rename(function (path) {
				path.basename = 'library';
			}))
			.pipe(gulp.dest(portletPath + '/' + portlet + '/src/main/webapp/js/'))
			.pipe(requirejs({
				optimize: 'none',
				paths: {'react': 'empty:',
					'react-dom': 'empty:'}
			}))
			.pipe(insert.append('require(["library"], function () {});'))
			//.pipe(browserify())
			.pipe(gulp.dest(portletPath + '/' + portlet +'/src/main/webapp/js/'));
	})
});

















// !!!!!!!!!!! NOT USABLE YET !!!!!!!!!!!!




//
//	Compile component (discouraged)
//
gulp.task("build-component", function () {
	var componentName = args["component-name"];
	var formComponentsPath = "./formComponents";
	return gulp.src(formComponentsPath + "/" + componentName + ".js")
		.pipe(babel(
			{
				"optional": "es7.classProperties",
				"modules": "amd"
			}
		))
		.pipe(gulp.dest(formComponentsPath + "/dist"));
});
//
//	Compile all components (preferred)
//
gulp.task("build-all-components", ["build-specific-components"]);


//
//	Compile specific components for one form only (subtask)
//
gulp.task("build-specific-component", function () {
	var formsPath = "./forms";
	var componentName = args["form-name"];
	return gulp.src(formsPath + "/" + componentName + "/formComponents/*.js", {base: "./"})
		.pipe(babel(
			{
				"optional": "es7.classProperties",
				"modules": "amd"
			}
		))
		.pipe(rename(function (fPath) {
			fPath.dirname = path.join(fPath.dirname, "dist");
		}))
		.pipe(gulp.dest("./"));
});



//
//	Find translation strings in BPUI forms code and write them to
//	convenient file. Much hardcoded.
//
gulp.task("grep-json", ["grep-form-json", "grep-widget-json"]);
gulp.task("grep-csv", ["grep-form-csv", "grep-widget-csv"]);


gulp.task("grep-form-json", function () {
	var formsPath = "./forms";
	return gulp.src(formsPath + "/**/main.js", {base: "./"})
		.pipe(rename(function (path) {
			//path.basename = "all_empty";
			path.basename = "all";
			path.extname = ".json";
		}))
		.pipe(gulp.dest("./"))
});
gulp.task("grep-form-csv", function () {
	var formsPath = "./forms";
	return gulp.src(formsPath + "/**/main.js", {base: "./"})
		.pipe(rename(function (path) {
			path.basename = "all_empty";
			path.extname = ".csv";
		}))
		.pipe(grepper({fileFormat: "csv"}))
		.pipe(gulp.dest("./"))
});

gulp.task("grep-widget-json", function () {
	var widgetsPath = "./widgets",
		widgets = getFolders(widgetsPath, ["OBSOLETE"]);

	var tasks = widgets.map(function (folder) {
		return gulp.src(path.join(widgetsPath, folder, '/**/*.html'))
			.pipe(concat(folder + '.js'))
			.pipe(rename(function (path) {
				//path.basename = "all_empty";
				path.basename = "all";
				path.extname = ".json";
			}))
			.pipe(grepper({parseFor: "angularTemplate"}))
			//			.pipe(gulp.dest("widgetsPath"))
			.pipe(gulp.dest(path.join(widgetsPath, folder, "./locale/")))
	});

	return mergeStream(tasks);
});
gulp.task("grep-widget-csv", function () {
	var widgetsPath = "./widgets",
		widgets = getFolders(widgetsPath, ["OBSOLETE"]);

	var tasks = widgets.map(function (folder) {
		return gulp.src(path.join(widgetsPath, folder, '/**/*.html'))
			.pipe(concat(folder + '.js'))
			.pipe(rename(function (path) {
				path.basename = "all_empty";
				path.extname = ".csv";
			}))
			.pipe(grepper({parseFor: "angularTemplate", fileFormat: "csv"}))
			//			.pipe(gulp.dest("widgetsPath"))
			.pipe(gulp.dest(path.join(widgetsPath, folder, "./locale/")))
	});

	return mergeStream(tasks);
});


gulp.task("grep-form-correct-json", function () {
	var formsPath = "./forms",
		translationsPath = "./locale",
		correctTranslations = csvParser(
			fs.readFileSync(
				path.join(translationsPath, "locale.csv")
			)
		);
	return gulp.src(formsPath + "/**/main.js", {base: "./"})
		.pipe(rename(function (path) {
			path.basename = "all";
			path.extname = ".json";
		}))
		.pipe(transFormatter({correctTranslations: correctTranslations}))
		.pipe(gulp.dest("./"))
		.pipe(rename(function (path) {
			path.basename = "missing";
			path.extname = ".csv";
		}))
		.pipe(transMissing())
		.pipe(gulp.dest("./"))
});
gulp.task("grep-widget-correct-json", function () {
	var widgetsPath = "./widgets",
		widgets = getFolders(widgetsPath, ["OBSOLETE"]),
		translationsPath = "./locale",
		correctTranslations = csvParser(
			fs.readFileSync(
				path.join(translationsPath, "locale.csv")
			)
		);

	var tasks = widgets.map(function (folder) {
		return gulp.src(path.join(widgetsPath, folder, '/**/*.html'))
			.pipe(concat(folder + '.js'))
			.pipe(rename(function (path) {
				path.basename = "all";
				path.extname = ".json";
			}))
			.pipe(transFormatter({correctTranslations: correctTranslations, parseFor: "angularTemplate"}))
			.pipe(gulp.dest(path.join(widgetsPath, folder, "./locale/")))
			.pipe(rename(function (path) {
				path.basename = "missing";
				path.extname = ".csv";
			}))
			.pipe(transMissing())
			.pipe(gulp.dest(path.join(widgetsPath, folder, "./locale/")))


			.pipe(grepper({parseFor: "angularTemplate"}))
			//			.pipe(gulp.dest("widgetsPath"))
			.pipe(gulp.dest(path.join(widgetsPath, folder, "./locale/")))
	});

	return mergeStream(tasks);
});


// -----------------------------------------------------------------------------
// Default task
// -----------------------------------------------------------------------------

gulp.task('default', ['sass', 'watch' /*, possible other tasks... */]);

