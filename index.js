let _filesToLoad;
let _drawingBoard;
let simpAnswer;
let tradAnswer;
let numbers = [];
let difficulty = 1000;
let lowerbound = 0;
let numRounds = 0;
let numCorrect = 0;
let charArray = []

$("#reset").click(function(e) {
    tempDiff = $("#difficulty").val()
    if (!isNaN(tempDiff) && tempDiff >= 1 && tempDiff <= 1000){
        difficulty = Number(tempDiff)
    }
    tempLowerbound = $("#lowerbound").val()
    if (!isNaN(tempLowerbound) && tempLowerbound >= 1 && tempLowerbound <= 1000){
        lowerbound = Number(tempLowerbound)
    }
    generatePermutation(lowerbound,difficulty)
    reset()    
})
$(".chinese").click(function(e) {
    guess(e.target.id.substring(7))
})


$("#next").click(function() {
    numRounds++;
    update(false);
})
$("#prev").click(function(e) {
    if (e.target.id !== "prev") {
        let word = e.target.innerText[0] === '(' ? e.target.innerText[1] : e.target.innerText[0];
        let idNumber = e.target.id.substring(8);
        $('#char').empty();
        $('#explanation').css('display', 'block')
        $('#animate').css('display', 'block')
        $('#hide').css('display', 'block')

        let writer = HanziWriter.create('char', word, {
            width: 100,
            height: 100,
            padding: 5,
            strokeAnimationSpeed: 1,
            delayBetweenStrokes: 200,
            showOutline: true
        });

        $('#animate').click(function() {
            writer.animateCharacter();
        })
        $('#hide').click(function() {
            $('#explanation').css('display', 'none')
            $('#animate').css('display', 'none')
            $('#hide').css('display', 'none')
        })

        let clicked = charArray[idNumber];

        $('#char-pinyin').html(`<h4 class="header">Pinyin:</h4> <p>${clicked.pinyin}</p>`)
        $('#char-def').html(`<h4 class="header">Definition:</h4> <p>${clicked.definition}</p>`)
        $("#char-form").html(`<h4 class="header">Character Formation: </h4>`);
        for (let i = 0; i < clicked.charForm.length; i++) {
            let innerArray = clicked.charForm[i];
            let current = $("#char-form").html()
            $("#char-form").html(`${current} 
                <p >
                ${innerArray.char} [${innerArray.pinyin}] ${innerArray.def}
                </p>
                `)

        }
    }

})

function generatePermutation(lowerbound,difficulty){

    let temp = []
    for (let i = lowerbound; i < lowerbound+difficulty; i++){
        temp.push(i);
    }
    for (let i = difficulty-1; i > 1; i--){
        let j = (Math.floor(Math.random()*10000000)) % (i+1)
        let k = temp[j]
        temp[j] = temp[i]
        temp[i] = k
    }
    numbers=temp
}

function reset(){
    numCorrect = 0 
    numRounds = 0
    update(false)
    $(`#prev`).html("")
    $('#explanation').css('display', 'none')
    $('#animate').css('display', 'none')
    $('#hide').css('display', 'none')
}

function update(correct) {
    $(`#score`).text(`Score: ${numCorrect} / ${numRounds}`)
    let currentText = $(`#prev`).html();
    let colour = correct ? "green" : "red";
    if (simpAnswer !== tradAnswer) {
        $(`#prev`).html(`${currentText} <p style="text-decoration:underline; text-decoration-color:${colour}" class = "answers" id = answers-${numRounds}>${simpAnswer}</p><p class = "answers" id = answers-${numRounds}>(${tradAnswer}),<\p>`);
    } else {
        $(`#prev`).html(`${currentText} <p style="text-decoration:underline; text-decoration-color:${colour}" class = "answers" id = answers-${numRounds} >${simpAnswer},<\p>`);
    }
    assign(numbers[numRounds%numbers.length])
    if (numRounds%numbers.length == numbers.length-1){
        generatePermutation(lowerbound,difficulty)
    }

    _drawingBoard.clearCanvas();
    _drawingBoard.redraw();
    lookup();
}

function guess(num) {
    let guess = $(`#chinese${num}`).text();
    if ((guess === (simpAnswer)) || (guess === (tradAnswer))) {
        $("#response").css('color','green')
        $("#response").text("Correct!").show().fadeOut('slow')
        numRounds++;
        numCorrect++;
        update(true);

    } else {
        $("#response").css('color','red')
        $("#response").text("Try again!").show().fadeOut('slow');
    }

}

$(document).ready(function() {

    // Only fetch data (large, takes long) when the page has loaded
    _filesToLoad = 2;
    HanziLookup.init("mmah", "https://raw.githubusercontent.com/Resocram/chinese/master/dist/mmah.json", fileLoaded);
    HanziLookup.init("orig", "https://raw.githubusercontent.com/Resocram/chinese/master/dist/orig.json", fileLoaded);
    generatePermutation(lowerbound,difficulty)
    assign(numbers[numRounds%numbers.length])
});


//Assigns definition and pinyin to chosen word
function assign(number) {
    let fields = dataArray[number];
    $("#pinyin").text(fields.pinyin);
    $("#definition").text(fields.definition);
    $("#example").empty();
    let length = fields.exampleWord.length > 3 ? 3 : fields.exampleWord.length;
    let answers = fields.char;
    simpAnswer = answers[0];
    tradAnswer = answers[0];
    if (answers.indexOf("F") !== -1) {
        tradAnswer = answers[answers.indexOf("F") + 1]
    }
    for (let i = 0; i < length; i++) {
        let currentText = $("#example").html();
        let word = fields.exampleWord[i];
        $("#example").html(`${currentText} <p>${word.char.replace(simpAnswer,"__").replace(tradAnswer, "__")} [${word.pinyin}] ${word.definition}</p>`)
    }

    charArray[numRounds + 1] = dataArray[number]
}


// Initializes mini-app once all scripts have loaded
function fileLoaded(success) {
    if (!success) {
        _filesToLoad = -1;
        $(".drawingBoard span").text("Failed to load data.");
        return;
    }
    --_filesToLoad;
    if (_filesToLoad != 0) return;
    // All data scripts loaded
    $(".drawingBoard").removeClass("loading");
    // Create handwriting canvas (this is optional, you can bring your own)
    _drawingBoard = HanziLookup.DrawingBoard($(".drawingBoard").first(), lookup);
    // Undo/redo commands - have to do with input
    $(".cmdUndo").click(function(evt) {
        _drawingBoard.undoStroke();
        _drawingBoard.redraw();
        lookup();
    });
    $(".cmdClear").click(function(evt) {
        _drawingBoard.clearCanvas();
        _drawingBoard.redraw();
        lookup();
    });
}

// Fetches hand-drawn input from drawing board and looks up Hanzi
function lookup() {
    // Decompose character from drawing board
    var analyzedChar = new HanziLookup.AnalyzedCharacter(_drawingBoard.cloneStrokes());
    // Look up with original HanziLookup data
    var matcherOrig = new HanziLookup.Matcher("orig");
    matcherOrig.match(analyzedChar, 8, function(matches) {
        first = matches.map(char => char.character)
        showResults()
    });
    // Look up with MMAH data
    var matcherMMAH = new HanziLookup.Matcher("mmah");
    matcherMMAH.match(analyzedChar, 8, function(matches) {
        second = matches.map(char => char.character)
        showResults()
    });

}

first = []
second = []
function showResults(){
    var displaying = new Set()
    let i, l = Math.min(first.length, second.length);
    var result = []
    for (i = 0; i < l; i++) {
        result.push(first[i], second[i]);
    }
    result.push(...first.slice(l), ...second.slice(l));
    displaying = new Set(result)
    newArray = Array.from(displaying)
    for (let i = 0; i < newArray.length && i < 8; i++){
        $(`#chinese${i}`).text(`${newArray[i]}`);
    }

}