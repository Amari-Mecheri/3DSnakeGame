const refreshInterval = 100; // Defines the animations refresh rate
const defaultBoardSize = 50;
var boardSize = { Width: defaultBoardSize, Height: defaultBoardSize };
var freeSpace, candyBody, snakePart;
var gameInProgress, score, highScore, snakeLength, round, snakePosition, snakeTail, direction;
var clearBoardView;

var playGame = () => {};

// launches the game once wasm is ready
function setupGame(...functions) {
  [clearBoardView] = functions;
  //document.addEventListener("wasmLoaded",()=>{
  //console.log("wasmLoaded event caught")
  //updateMessage("Game Over")
  freeSpace = FreeSpace();
  candyBody = CandyBody();
  snakePart = SnakePart();
  playGame = launchGame;
  return initGame();
  //document.addEventListener("keydown", handleKeyDown);
  //})
}

function initGame() {
  let err = InitBoard(boardSize);
  if (!err) {
    clearBoardView();
    const listSprite = JSON.parse(CreateObjects());
    //displayObjects(listSprite);
    updateValues();
    return listSprite;
  }
}

function updateValues() {
  gameInProgress = GameInProgress();
  score = Score();
  highScore = HighScore();
  snakeLength = SnakeSize();
  round = Round();
  snakePosition = JSON.parse(SnakePosition());
  snakeTail = JSON.parse(SnakeTail());
  direction = JSON.parse(SnakeDirection());
  //updateStateView()
}

// function clearBoardView() {
//     for( let x=0; x<boardSize.Height; x++)
//       for( let y=0; y<boardSize.Width; y++)
//       clearPixel(x,y)
// }

function updateBoardSize() {
  let size = boardSize.Width;
  size += sizeIncrement;
  if (size > defaultBoardSize) {
    size = sizeIncrement;
  }

  boardSize = { Width: size, Height: size };
}

function launchGame() {
  if (GameInProgress()) {
    const listSprite = JSON.parse(Play());
    //displayObjects(listSprite)
    updateValues();
    return listSprite;
  }
}

function handleKeyDown(key) {
  //console.log(key);
  //const key = e.key;
  switch (key) {
    case 1:
    case "ArrowLeft":
      MoveLeft();
      break;

    case 2:
    case "ArrowRight":
      MoveRight();
      break;

    case 3:
    case "ArrowUp":
      MoveUp();
      break;

    case 4:
    case "ArrowDown":
      MoveDown();
      break;

    case 5:
    case "Enter":
      // if(!GameInProgress()){
      //     updateBoardSize()
      //     createBoardView(boardSize)
      //     initGame();
      // }
      break;

    case 6:
    case " ":
      if (!GameInProgress()) {
        let listSprite;
        if (Dirty()) {
          listSprite = initGame();
        }
        Start();
        return listSprite;
        //updateMessage("")
        //launchGame()
      }
      break;

    default:
      break;
  }
}

function displayObjects(listSprite) {
  if (listSprite) {
    for (let i = 0; i < listSprite.length; i++) {
      const sprite = listSprite[i];

      switch (sprite.Value) {
        case freeSpace:
          clearPixel(sprite.Position.X, sprite.Position.Y);
          break;
        case candyBody:
          setCandy(sprite.Position.X, sprite.Position.Y);
          break;
        case snakePart:
          setSnakePart(
            sprite.Position.X,
            sprite.Position.Y,
            JSON.parse(SnakeDirection())
          );
          break;

        default:
          break;
      }
    }
  }
}
