export class CMDs {
  private commands: any = {};
  public history: string[] = [""];

  /**
   * Handles all of the possible commands
   * @param initialCommands {object} commands which should be initialized at the beginning
   */
  constructor(initialCommands: object) {
    let storageCmds = localStorage.getItem("lastCmds");
    if (storageCmds !== null) {
      this.history = JSON.parse(storageCmds);
    }

    if (initialCommands) {
      this.commands = initialCommands;
    }
  }

  /**
   * Add a new command to the interface
   * @param name 'wakeword' of the command
   * @param backend function which handles the logic and arguments passed after the execution
   * @param description (optional) short description of what your program does
   */
  public add(
    name: string,
    backend: (path: Path, args: string[]) => '',
    description?: string
  ): void {
    this.commands[name] = {
      func: backend,
      desc: description || "",
    };
  }

  /**
   * Get all commands
   * @returns the entiry command object
   */
  public all(): object {
    return this.commands;
  }

  /**
   * get all command names
   */
  public keys(): string[] {
    return Object.keys(this.commands);
  }

  /**
   * get the object of the programm
   * @param name command name
   * @returns {object} the function and description of your programm
   */
  public find(name: string): object|undefined {
    return this.commands[name];
  }
}

export class Path {
  private value: string[] = [];
  public length: number = 0;

  /**
   * Creates a path object
   * @param path {string|string[]} path to save
   */
  constructor(path?: string | string[]) {
    let valid: boolean;
    switch (typeof path) {
      case "string":
        path = path.trim().split("/")
        this.value = path.filter((folder: string): boolean => folder ? true : false);
        valid = true;
        break;
      case "object":
        if (Array.isArray(path)) {
          this.value = path.filter((folder: string): boolean => folder ? true : false);
          valid = true;
        }
        break;
      case 'undefined':
        this.value = [];
        valid = true;
    }
    if (!valid) {
      throw new Error(`${path} is not a path.`);
    }
    this.length = this.value.length;
  }

  /**
   * Gives you the path as a / delimited string
   * @returns {string} the relative path
   */
  public toString(): string {
    return this.value.join("/");
  }

  /**
   * Gives the path as an array
   * @returns {string[]} the path as a string[]
   */
  public toObject(): string[] {
    return this.value;
  }

  /**
   * Merges two paths
   * @param lastPath path to append
   * @returns {string[]} the concatinated array
   */
  public concat(lastPath: Path | string[]): string[] {
    if (!Array.isArray(lastPath)) {
      lastPath = lastPath.toObject();
    }
    return this.value.concat(lastPath);
  }

  /**
   * Removes the last element from the path
   * @returns the removed pathname
   */
  public pop(): string {
    return this.value.pop();
  }

  /**
   * Adds one directory
   * @param directoryName the directory to append
   * @returns {number} the number of directories the path includes
   */
  public push(directoryName: string): number {
    return this.value.push(directoryName);
  }

  /**
   * Removes the first directory from the path
   * @returns the removed directory
   */
  public shift(): string {
    return this.value.shift();
  }

  /**
   * Gives you the name of the directory at the given index
   * @param index number of the directory
   * @returns name of the directory
   */
  public find(index: number): string {
    return this.value[index];
  }
}

export class Filesystem {
  // Starting directory
  public activeDirectory: Path = new Path([]);

  // the folder name in green in front of the caret
  public displayPath = "root";
  public pathPrefix = "users/louis/root"; // just for good looking purposes (for the path command)
  public root: object;

  /**
   * Emulates a filesystem
   * @param initialFilesystem json object which represents the initial filestructure
   */
  constructor(initialFilesystem: object) {
    this.root = initialFilesystem || {
      meta: {
        type: "folder",
      },
    };
  }

  /**
   * if all of the parameters exist, return the right path
   * @param name string to check if not empty
   * @param contents check if not falsy
   * @param path check if path exists
   */
  private getPath(name: string, contents: string, path: Path): any {
    if (!name || !contents) {
      throw new Error("Name and contents are required for file/folder creation!");
    } else if (!path) {
      console.warn('Path not specified on file/folder creation! (defaulting to root)')
      return this.root;
    } else if (!this.getFolder(path)) {
      throw new Error(`Cannot get folder destination! ${path}`);
    } else {
      return this.getFolder(path)
    }
  }

  /**
   * Gets the folder at the path
   * @returns the contents of the folder on the specified path
   * @param path path to visit
   */
  public getFolder(path: Path | string[]): any {
    if (Array.isArray(path)) {
      path = new Path(path);
    }
    let folder: any = this.root;
    for (let i = 0; i < path.toObject().length; i++) {
      const current = path.toObject()[i];
      folder = folder[current];
    }
    return folder;
  }

  /**
   * adds a file to the emulated filesystem
   * @param name name of the file (with ending [dots are allowed])
   * @param contents html string of the contents of the file
   * @param path absolute path of the file location
   */
  public addFile(name: string, contents: string, path: Path): void {
    const currPath = this.getPath(name, contents, path);
    console.log('hello:', currPath)
    if (currPath) {
      currPath[name] = contents;
    }
  }

  /**
   * Adds a new object to the filesystem
   * @param name file/folder name
   * @param contents contents of the file/folder
   * @param path where the file/folder should be stored
   * @throws Error if one of the parameters is falsy
   */
  public addCustom(
    name: string,
    contents = { meta: { type: "folder|download|link|custom" } },
    path: Path
  ): void {
    if (
      !name ||
      !contents ||
      !contents.meta ||
      !contents.meta.type ||
      typeof contents.meta.type !== "string" ||
      !path
    ) {
      throw new Error("Check your file syntax");
    } else {
      this.getFolder(path)[name] = contents;
    }
  }
}

export class Helper {
  /**
   * Places the cursor at the end of the element
   * @author Tim Down (https://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser)
   * @param el Element where the caret should be at the last position
   */
  static placeCaretAtEnd(el: HTMLElement): void {
    el.focus();
    if (
      typeof window.getSelection != "undefined" &&
      typeof document.createRange != "undefined"
    ) {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
}