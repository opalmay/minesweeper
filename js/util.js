function copyObjMat(mat) {
    var newMat = [];
    for (var i = 0; i < mat.length; i++) {
        newMat[i] = [];
        for (var j = 0; j < mat[0].length; j++) {
            newMat[i][j] = Object.assign({}, mat[i][j])
        }
    }
    return newMat;
}
function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
