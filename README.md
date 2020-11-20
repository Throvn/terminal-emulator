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
### Add your own command
In `index.ts`
```typescript
const structure = {
    commands: {
        ...
        yourCommand: { //! case-sensitive
            desc: 'a short description of your command',
            func: (path:string, args:string[]) => {
                // path - active directory
                // args[0] - command
                // args[1..] - first, second, ... argument and so on

                return 'this is an <b>html</b> string which will be written to the stdout';
            }
        }
    },
    filesystem: { 
        ...
    }
}
```
### Add your own folders, files and other stuff
In `index.ts`
```typescript
const structure = {
    commands: {
        ...
    },
    filesystem: { 
        ...
        'foldername': {
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
        }
    }
}
```

### Important global varibles
- `currentTree`:string[] – returns the absolute and current path
-  `path`:string – the string displayed in green in the terminal
- `pathPrefix`:string – a string which is prepended before the absolute (`currentTree`) path

### This project is far from done!
- If you have noticed an issue or bug report it [here.](https://github.com/Throvn/terminal-emulator/issues)
- Contributors and maintainers always welcome!
- If you have used this project for your project, let me know :)
- Share your contributions so others can profit too.

#### TODOs (for now)

1. [ ] clean up the code
2. [ ] rewrite the autocomplete method for the sake of performance
3. [ ] split the code into multiple files
4. [ ] fully document the code
5. [ ] add the ability to create files via `echo` or `nano` command
6. [ ] save files created by the user in local storage.
7. [ ] use webpack

