var sharedArray;
var loaded = false;

self.importScripts(
  "workerConsts.js",
  "../wasm/wasm_exec.js",
  "../wasm/initWsm.js",
  "../wasm/launchGame.js"
);

self.addEventListener("message", (content) => {
  sharedArray = new Int32Array(content.data);
  wasmLoaded(() => {
    loaded = true;
    if (sharedArray) {
      clearArray();
      sendListSprite(setupGame(clearBoardView));
      sendValues();
      Atomics.store(sharedArray, indexes.State, workerState.Dirty);
      Atomics.wait(sharedArray, indexes.State, workerState.Dirty);
      mainLoop();
    } else console.log("sharedArray not defined");
  });
});

mainLoop = () => {
  while (Atomics.load(sharedArray, indexes.State) !== workerState.Quit) {
    let skipFrame = Atomics.load(sharedArray, indexes.SkipFrame);
    let keyPressed = Atomics.load(sharedArray, indexes.KeyDown);

    clearArray();

    let listSprite;
    if (keyPressed != 0) {
      listSprite = handleKeyDown(keyPressed);
    }

    if (listSprite) sendListSprite(listSprite);
    else if (!skipFrame) sendListSprite(playGame());

    sendValues();
    Atomics.store(sharedArray, indexes.State, workerState.Dirty);
    Atomics.wait(sharedArray, indexes.State, workerState.Dirty);
  }
};

clearArray = () => {
  for (let i = 0; i < indexes.End; i++) Atomics.store(sharedArray, i, 0);
};

sendValues = () => {
  Atomics.store(sharedArray, indexes.SnakeSize, snakeLength);
  Atomics.store(sharedArray, indexes.SnakeHead, snakePosition.X);
  Atomics.store(sharedArray, indexes.SnakeHead + 1, snakePosition.Y);
  Atomics.store(sharedArray, indexes.SnakeTail, snakeTail.X);
  Atomics.store(sharedArray, indexes.SnakeTail + 1, snakeTail.Y);
  Atomics.store(sharedArray, indexes.SnakeDirection, direction.DX);
  Atomics.store(sharedArray, indexes.SnakeDirection + 1, direction.DY);
  Atomics.store(sharedArray, indexes.GameInProgress, gameInProgress?1:0);
  Atomics.store(sharedArray, indexes.Score, score);
  Atomics.store(sharedArray, indexes.HighScore, highScore);
  Atomics.store(sharedArray, indexes.Round, round);
  Atomics.store(sharedArray, indexes.Candy, candyBody);
  Atomics.store(sharedArray, indexes.Snake, snakePart);
  Atomics.store(sharedArray, indexes.Space, freeSpace);
};

sendListSprite = (listSprite) => {
  if (listSprite) {
    for (let i = 0; i < listSprite.length; i++) {
      const sprite = listSprite[i];
      Atomics.store(sharedArray, indexes.ListSprites + i * 3, sprite.Value);
      Atomics.store(
        sharedArray,
        indexes.ListSprites + i * 3 + 1,
        sprite.Position.X
      );
      Atomics.store(
        sharedArray,
        indexes.ListSprites + i * 3 + 2,
        sprite.Position.Y
      );
    }
  }
};

clearBoardView = () => {
  Atomics.store(sharedArray, indexes.ClearBoard, 1);
};

// onmessage = (data) => {
//     switch (data.data.eventType) {
//         case "INIT":
//             wasmLoaded(()=>{setupGame(deleteTail, candy, snakePart,clearBoardView)});
//             break;
//         case "PLAY":
//             playGame();
//             break;
//         case "KEYDOWN":
//             handleKeyDown(data.data.e);
//             break;

//         default:
//             console.log("unknown eventType "+data.eventType);
//             break;
//     }
//   };

//   onmessageerror = (err) => { console.log(err); };
//   onerror = (err) => { console.log(err); };

//   deleteTail = (x,y) => {
//       postMessage({
//           message:"deleteTail",
//           x: x,
//           y: y,
//       });
//   }

//   candy = (x,y) => {
//     postMessage({
//         message:"candy",
//         x: x,
//         y: y,
//     });
//   }

//   snakePart = (x,y, direction) => {
//     postMessage({
//         message:"snakePart",
//         x: x,
//         y: y,
//         direction: direction,
//     });
//   }

//   clearBoardView = () => {
//     postMessage({
//         message:"clearBoard",
//     });
//   }
