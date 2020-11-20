# Terminal-Emulator
An interactive command line that allows you to explore me as a person and my interests. The infrastructure is modular so feel free to fork the project and make your own version.

## Features
 - draggable window
 - customizable, modular commands
 - responsive
 - autocompletion for commands
 - autocompletion for paths
 - the last commands are saved (reachable via `ArrowUp`, `ArrowDown`)
 - cross-browser compatible

## Benefits
 - :globe_with_meridians: **Modular** - Create your own command in seconds by adding it to the `structure` object
 - :leopard: **Fast** – Save time. Don't start from scratch. Contribute and let others profit too!
 - :cherry_blossom: **Beautiful** – Use the wonderful layout which is easy customizable and will fit all your needs.

## API
How do I adjust this to my needs?

### Important varibles
- `fs.activeDirectory`: Path – returns the absolute and current path
-  `fs.displayPath`: string – the string displayed in green in the terminal
- `fs.pathPrefix`: string – a string which is prepended before the absolute (`fs.activeDirectory`) path

### Add your own command
In `init.ts`
```typescript
Commands.add(
    'commandName', //! case-sensitive
    (path: Path, args: string[]): string => {
        // path - active directory
        // args[0] - command
        // args[1..] - first, second, ... argument and so on

        return 'this is an <b>html</b> string which will be written to the stdout.';
    },
    'a short description of your command' // (optional) description of your command
)
```
### Add your own folders, files and other stuff
In `init.ts`
```typescript

fs.addCustom(
    'foldername', // name
    { // content
        meta: { // every object needs meta object
            type: 'folder' // the type is always required!

            // the meta object not be visible to the user
            // so you can store additional information about the 
            // files/folder here
        },
        'subfolder': {
            meta: { ... }
        },

        // styling is done via inline-styles or the `styles.css` file
        'filename.ending': 'also a <em>html-string!</em>', 
        'downloadableFile': {
            meta: {
                type: 'download' 
            },
            link: './path/to/downloadableFile.exe'
            // the cat command downloads files automatically
            // (my cv.pdf for reference)
        }
    },
    new Path(['path', 'where', 'it', 'should', 'be', 'stored']) // note: the path must already be there
)
```

### Personalize in new file
1. create a new `filename.ts` in `src/`
2. in `webpack.config.js` add `'./src/filename.ts'` to the entry array
3. Paste this into `filename.ts`. Use the following snippet so you have access to all of the important functions and variables:
```typescript
import {Helper} from './core'
import {Commands, fs, domCmd} from './init'

/* Start your new project here */
```


### This project is far from done!
- If you have noticed an issue or bug report it [here.](https://github.com/Throvn/terminal-emulator/issues)
- Contributors and maintainers always welcome!
- If you have used this project for your project, let me know :)
- Share your contributions so others can profit too.

#### TODOs (for now)

1. [x] clean up the code
2. [ ] rewrite the autocomplete method for the sake of performance
3. [x] split the code into multiple files
4. [x] fully document the code
5. [ ] add the ability to create files via `echo` or `nano` command
    - [ ] save files created by the user in local storage.
7. [x] use webpack
8. [x] fix the last commands issue (Arrow Up should always work)

