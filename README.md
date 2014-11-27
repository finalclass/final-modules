FinalModules
============

FinalModules is a gulp task generator class. I uses convention over Configuration.

## So, what's the convention?

The convention is about the code organization and selection of tools for browser development.
FinalModules generates only gulp tasks for browser code.
Your code should be written in TypeScript.
As for now only Stylus is supported.

### Directories

You should create in your public directory a place for your final-modules, let it be `public/final-modules` directory.
  Then split your project into modules and place each module as a directory in public/final-modules dir.
  Let's say we will have `core` module and `app` module.:
  
    public
    └── final-modules
        ├── app
        ── core

Then inside of every module your code should go to `src` directory:

    public/
    └── final-modules
        ├── app
        │   └── src
        │       ├── application
        │       │   ├── application.styl
        │       │   ├── application.html
        │       │   └── Application.ts
        │       └── mainMenu
        │           ├── mainMenu.html
        │           ├── mainMenu.styl
        │           └── MainMenu.ts
        └── core
            └── src
                ├── CoreComponent.ts
                ├── core.styl
                ├── footer
                │   ├── footer.html
                │   ├── footer.styl
                │   └── Footer.ts
                ├── header
                │   ├── header.html
                │   ├── header.styl
                │   └── Header.ts
                └── layout.html

After compilation all compiled module's files will be placed inside of a `build` directory of each module.

### Conventions in TypeScript files

Let's say Application.ts file depends on CoreComponent.ts, we would love to have declarations generated for core module first and then just use one declaration file for all the core module.

FinalModules creates gulp tasks that generates declaration files and puts them inside a build folder of each module, so then inside of the Application.ts we would have this reference:

    ///<reference path="../../core/build/core.d.ts"/>

Another think about TypeScript in FinalModules is usage of amd/commonjs modules. We don't use any of them since the code is separated and concatenated into modules. Your example typescript file should look like this:

    ///<reference path="../../core/build/core.d.ts"/>
    
    module app {
    
      export class Application extends core.CoreComponent {
        constructor() {
          super();    
        }
      }
    
    }

### Conventions in HTML

Every \*.html file in the module's src directory will be placed in moduleName.html.js file as a variable.
 For example, the content of the application.html file would be inside of a variable: `app.html.application`,
 content of a footer.html would be inside of a `core.html.footer` variable.

### Stylus

Every \*.styl file found in the module's src directory will be compiled with stylus (with nib plugin available) and merged into moduleName.css file with the coresponding map file.

### Watching TypeScript

The `fm:*:watch:ts` tasks watch only the files of a particular module but when the change occures they run a compilation of every module that is dependent upon the changed module. FinalModules resolve dependencies using [dependency-resolver](https://www.npmjs.org/package/dependency-resolver "dependency-resolver") node package.

## Usage

First, install the plugin using npm:

    npm install final-modules --save-dev

inside your `gulpfile.js`:

    var gulp = require('gulp');
    var FinalModules = require('final-modules');
    
    var mods = new FinalModules('public/src');
    mods.add('core');
    mods.add('app', ['core']);
    mods.generateTasks(gulp);
    
This code will generate the following gulp tasks:

- for core module: `fm:core`, `fm:core:clean`, `fm:core:html`, `fm:core:ts`, `fm:core:ts:standalone`, `fm:core:min`, `fm:core:styl`, `fm:core:watch`, `fm:core:watch:ts`, `fm:core:watch:styl`, `fm:core:watch:html`
- for app module: `fm:app`, `fm:app:clean`, `fm:app:html`, `fm:app:ts`, `fm:app:min`, `fm:app:styl`, `fm:app:watch`, `fm:app:watch:ts`, `fm:app:watch:styl`, `fm:app:watch:html`
- for all the modules: `fm`, `fm:clean`, `fm:html`, `fm:ts`, `fm:min`, `fm:styl`, `fm:watch`, `fm:watch:ts`, `fm:watch:styl`, `fm:watch:html`

After that you can add a default task that will run all the generated tasks with this statement:
 
    gulp.task('default', ['fm']);
  
## Compilation

To compile all the final-modules use gulp inside your projects:
 
    gulp fm
    
This will generate `build` directories inside of each module. In our example it looks like that:

    public/
    └── src
        ├── app
        │   ├── build
        │   │   ├── app.d.ts
        │   │   ├── app.html.js
        │   │   ├── app.js
        │   │   ├── app.js.map
        │   │   ├── app.min.js
        │   │   └── app.min.js.map
        │   └── src
        │       ├── application
        │       │   ├── application.html
        │       │   ├── application.styl
        │       │   └── Application.ts
        │       └── mainMenu
        │           ├── mainMenu.html
        │           ├── mainMenu.styl
        │           └── MainMenu.ts
        └── core
            ├── build
            │   ├── core.d.ts
            │   ├── core.html.js
            │   ├── core.js
            │   ├── core.js.map
            │   ├── core.min.js
            │   └── core.min.js.map
            └── src
                ├── CoreComponent.ts
                ├── core.styl
                ├── footer
                │   ├── footer.html
                │   ├── footer.styl
                │   └── Footer.ts
                ├── header
                │   ├── header.html
                │   ├── header.styl
                │   └── Header.ts
                └── layout.html
                
## License: ISC

ISC is even simpler **MIT** like license. See `LICENSE` file.
