function pattern1(n) {
    // *
    // **
    // ***
    // ****
    // *****
    for(var row=0; row<n; row++) {
        var str = ""
        for (col=0; col<=row; col++) {
            str += "* ";
        }
        console.log(str)
    }
}

function pattern2(n) {
    // *****
    // ****
    // ***
    // **
    // *
    var numofColToPrint = n;
    for (var row=0; row<n; row++) {
        var str = ""
        for (col=0; col<numofColToPrint; col++) {
            str += "*"
        }
        numofColToPrint--
        console.log(str)
    }
}

function pattern3(n) {
//      *
//     **
//    ***
//   ****
//  *****
    var noOfRow = n;
    var noOfColWithSpace = n-1;
    for (var row=0; row<noOfRow; row++) {
        var str ="";
        for(var col=0;col<noOfColWithSpace; col++) {
            str += " "
        }
        noOfColWithSpace--
        for (var col=0; col<=row; col++) {
            str += "*"
        }
        console.log(str)
    }
}

