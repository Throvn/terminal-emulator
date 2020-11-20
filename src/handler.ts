import {Helper} from './core'
import {Commands, fs, domCmd} from './init'
let $cmd = domCmd
let index = 0; // for the command history

/**
 * parses the user input and calles the corresponding functions
 * @param rawCmd user input
 */
function checkCommands(rawCmd: string): void {
    if (!rawCmd) return;
  
    rawCmd = rawCmd.replace("\n", "");
    const cmd = rawCmd.split(/ +/g);
    const command = Commands.find(cmd[0]);
  
    const result = command
      ? command.func(fs.activeDirectory, cmd)
      : Commands.find("notFound").func(fs.activeDirectory, cmd);
    $cmd.parentElement.parentElement.insertAdjacentHTML(
      "beforeend",
      `<div class="window-response">${result ? result : ""}</div>`
    );
  }
  
  /**
   * checks if the user typed something into the input bar
   * @param evt Keyboard event
   */
  const checkInput = function (evt: KeyboardEvent): void {
    console.log($cmd.innerText);
    console.log(evt.key);
    if (evt.key === "Enter") {
      (<HTMLDivElement>evt.target).removeAttribute("contenteditable");
      const cmd = $cmd.innerText.replace("\n", " ");
      checkCommands(cmd); // check for command input
      Commands.history.unshift(cmd);
  
      // creat new command line
      $cmd.parentElement.parentElement.insertAdjacentHTML(
        "beforeend",
        `
              <div class="line">
                  <span class="pre-input">${fs.displayPath} <b class="pre-divide">❯</b></span>  
                  <div class="window-input" contenteditable=""></div>
              </div>
          `
      );
  
      // clean up after the old command line
      $cmd = <HTMLDivElement>(
        document.querySelector(".window-content").lastElementChild
          .lastElementChild
      );
      $cmd.onkeypress = checkInput;
      this.removeEventListener("input", checkInput);
  
      $cmd.focus();
      Helper.placeCaretAtEnd($cmd);
  
      index = 0; // set the index for last commands back to zero
    } else {
      //automatically transforms the first character to lowercase (mobile devices write the first letter uppercase)
      if ($cmd.innerText.charAt(0) === $cmd.innerText.charAt(0).toUpperCase()) {
        $cmd.innerText =
          $cmd.innerText.charAt(0).toLowerCase() + $cmd.innerText.substr(1);
        Helper.placeCaretAtEnd($cmd);
        $cmd.focus();
      }
    }
  };
  $cmd.onkeyup = checkInput;
  
  /**
   * handles the autocomplete process & last commands
   * @param evt KeyboardEvent
   */
  document.body.onkeyup = (evt: KeyboardEvent): void => {
    if (evt.key === "Tab") {
      const tmpInp = $cmd.innerText.replace("\n", "").split(/ +/g);
  
      if (tmpInp.length === 1) {
        const commandNames = Commands.keys();
        const autoComplete = commandNames.filter(
          (name:string): boolean => name.lastIndexOf(tmpInp[0], 0) === 0
        );
        if (autoComplete.length === 1) {
          $cmd.innerText = autoComplete[0];
          Helper.placeCaretAtEnd($cmd);
        }
      } else if (tmpInp.length === 2) {
        const previousTree = tmpInp[1].split("/"); // turn folder structure to array
        if (previousTree[0] === ".") {
          previousTree.shift();
        }
  
        const searchWord = previousTree.pop(); // save the last not yet typed out word
        const autoComplete = Object.keys(
          fs.getFolder(fs.activeDirectory.concat(previousTree))
        ) // get all contents of the current directory
          .filter((name): boolean => name.lastIndexOf(searchWord, 0) === 0); // search for filenames/directories which start with the searchword
        if (autoComplete.length === 1) {
          // if only one match was found -> autocomplete
          $cmd.innerText =
            tmpInp[0] +
            " " +
            (previousTree[0] ? previousTree.join("/") + "/" : "") +
            autoComplete[0];
          Helper.placeCaretAtEnd($cmd);
        }
      }
  
      // focus where the user has left of
      $cmd.focus();
    } else if (evt.key === "ArrowUp") {
      // go through last commands
      console.log(Commands.history);
      if (Commands.history.length > 0 && index + 1 <= Commands.history.length) {
        $cmd.innerText = Commands.history[index];
        index += 1;
        Helper.placeCaretAtEnd($cmd);
      }
    } else if (evt.key === "ArrowDown") {
      // return to last commands
      if (Commands.history.length > 0 && index - 1 >= 0) {
        index -= 1;
        $cmd.innerText = Commands.history[index];
        Helper.placeCaretAtEnd($cmd);
      }
    }
  };
  $cmd.focus();
  
  /**
   * save last 30 executed commands to local storage
   * @param evt Event
   */
  window.onbeforeunload = (evt: Event): void => {
    localStorage.setItem(
      "lastCmds",
      JSON.stringify(Commands.history.slice(0, 30))
    );
  };