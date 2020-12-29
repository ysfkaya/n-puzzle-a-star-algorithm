// Kodların katı kurallara uyması gerektiğini bildiriyoruz.
// Böylece herhangi ufak bir hata da sistemde hata mesajını görebileceğiz.
"use strict";

// Çözülebilen matrix dizilerini yükledik.
const { solvableStates } = require('./solvable');

// Gerekli kütüphaneleri ekledik.
window._ = require('lodash');
window.moment = require('moment');

// Tabloyu oluşturacağımız alanı değişkene aktarıyoruz
let _board = document.getElementById('board');

// Bir tablo oluşturuyoruz
let table = document.createElement('table');

// Tablonun gövde kısmını oluşturuyoruz.
let tBody = document.createElement('tbody');

// "Çöz" butonunu seçiyoruz
let bSolve = document.getElementById('solve');

// "Çözülebilen" butonunu seçiyoruz
let bSolvable = document.getElementById('solvable');

// "Karıştır" butonunu seçiyoruz
let bShuffle = document.getElementById('shuffle');

// "Sıfırla" butonunu seçiyoruz
let bReset = document.getElementById('reset');

// Deneme sayısını belirteceğimiz inputu seçiyoruz.
let attemptInput = document.getElementById('attempt');

// Mevcut deneme sayısını göstereceğimiz alanı seçiyoruz.
let attemptsDiv = document.getElementById('attempts');

// Zamanı göstereceğimiz alanı seçiyoruz
let _time = document.getElementById('time');

// Program ilk açıldığında başlama zamanını belirtmek için global değişkenimiz.
let startTime = null;

// Tablodaki haraket ettireceğmiz karakterimiz
const cursor = '*';

// Varsayılan toplam deneme sayısı. Sıfırlama gerektiğinde bu değişkeni kullanıyoruz
const _attempts = 999;

// Toplam deneme sayısını değiştirmek için global bir değişken tanımlıyoruz
let attempts = _attempts;

// Algoritmayı uyguladığımızda seçtiğimiz matrixleri bu array'ın içine atıyoruz.
// Eğer havuzda daha önceden algoritma bölümünde seçilen matrix havuzda var ise
// bunu anlamamıza yardımcı oluyor.
let pool = [];

// Süre bölümünü başlatmak için tuttuğumuz zaman değişkeni
let timeInterval = null;

// Toplam geçen süre için global değişken
let time = 0;

// Arama işleminin başlayıp-başlamadığını anlamak için global değişken
let started = false;

// Varsayılan başlangıç matrix'i
const start_state = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, cursor]
];

// Hedef matrix'i
let goal_state = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, cursor]
];

// Deneme toplamı
let g = 0;

// Mevcut başlangıç matrix'i
// Algoritmayı uyguladığımızda seçilen yeni matrix'i
// bu değişkene atıyoruz.
let current = _.cloneDeep(start_state);

// Pencere yüklendiğinde çalışacak kodlarımız
window.addEventListener('load', (event) => {
    // Deneme sayısını input'a aktarıyoruz
    attemptInput.value = attempts;

    // Mevcut zamanımızı 0 olarak ekranda gösterilmesini sağlıyoruz.
    _time.innerHTML = formatTime(0);

    // "Çöz" butonuna tıklama işlemini dinliyoruz
    // Her tıklamada solve() fonksiyonu çalışacaktır.
    bSolve.addEventListener('click', solve);

    // "Karıştır" butonuna tıklama işlemini dinliyoruz
    // Her tıklamada shuffle() fonksiyonu çalışacaktır.
    bShuffle.addEventListener('click', shuffle);

    // "Sıfırla" butonuna tıklama işlemini dinliyoruz
    // Her tıklamada reset() fonksiyonu çalışacaktır.
    bReset.addEventListener('click', reset);

    // "Çözülebilen" butonuna tıklama işlemini dinliyoruz
    // Her tıklamada solve() fonksiyonu çalışacaktır.
    bSolvable.addEventListener('click', setSolvable);

    // Deneme sayısı input'u değiştirildiğinde
    // global değişken olan "attemps" değişkenimize aktarıyoruz.
    // Negatif bir değer girilmemesi için "Math.abs" metadonu kullanarak
    // mutlak değerini alıyoruz
    attemptInput.addEventListener('change', (e) => {
        attempts = Math.abs(parseInt(e.target.value));
    });

    // Mevcut toplam deneme sayısını ekranda yansıtıyoruz.
    attemptsDiv.textContent = 'Toplam Deneme : ' + g;

    // Mevcut başlangıç matrixi baz alınarak tablomuzu oluşturuyoruz.
    draw(start_state);
});

// Klavye olaylarını dinleyerek matrixi değiştirme işlemlerini
// takip ediyoruz.
window.addEventListener('keyup', move, true);

// "Çözülebilen" butonuna tıklandığında, tanımladığımız mevcut matrix dizisinden
// rastgele bir matrix seçiyoruz.
function setSolvable () {
    let maxIndex = solvableStates.length;
    // Dizinin adetine göre bir index belirliyoruz
    // ORN: 0-5 arası rastgele bir index
    let index = Math.floor(Math.random() * maxIndex);

    // Deneme sayısı dışında tüm ayarları sıfırlıyoruz.
    reset(true);

    current = _.cloneDeep(solvableStates[index]);

    draw(current);
}

// Parametrik olarak alınan matrixin hedef matrix ile
// eşit olup olmadığını kontrol ediyoruz.
function solved (state) {
    return JSON.stringify(state) === JSON.stringify(goal_state);
}

// Karıştır butonuna tıklandığında mevcut matrixin yerlerini
// değiştirme işlemini yapıyoruz.
function shuffle () {
    reset(true);

    let items = [];

    let temp = _.cloneDeep(start_state);

    start_state.forEach((row, i) => {
        row.forEach((col, j) => {
            items.push(start_state[i][j]);
        });
    });

    items = _.shuffle(items);

    temp = _.chunk(items, start_state[0].length);

    current = _.cloneDeep(temp);

    draw(current);
}

// Mevcut tabloyu ve ayarları sıfırlama fonksiyonu
function reset (ignoreAttempts) {
    ignoreAttempts = ignoreAttempts || false;

    stop();

    started = false;
    startTime = null;
    pool = [];
    time = 0;
    g = 0;

    if (!ignoreAttempts) {
        attempts = _attempts;
    }

    attemptInput.value = attempts;
    bSolve.innerText = 'Çöz';
    _time.innerHTML = formatTime(0);

    current = _.cloneDeep(start_state);

    attemptsDiv.innerHTML = 'Toplam Deneme : ' + g;

    draw(current);
}

// Başlama süresini belirtmek için fonksiyonumuz.
function start () {
    // Eğer daha önceden başlama süresi belirtilmemiş ise
    // bir başlama süresi belirtiyoruz.
    if (!startTime) {
        startTime = Date.now();
    }

    // Zamanın başlandığını işaretliyoruz
    started = true;

    // Tüm butonları ve inputları bu süreçte devre dışı bırakıyoruz.
    bShuffle.setAttribute('disabled', 'disabled');
    bReset.setAttribute('disabled', 'disabled');
    bSolvable.setAttribute('disabled', 'disabled');
    attemptInput.setAttribute('disabled', true);

    // "Çöz"  butonun ismini "Durdur" olarak değiştiriyoruz
    bSolve.innerText = 'Durdur';

    // setInterval fonksiyonun kullanarak her 1 ms de mevcut geçen zamanı
    // kontrol ediyoruz ve bunu düzenli bir şekilde ekranda yansıtıyoruz.
    timeInterval = setInterval(function () {
        let currentTime = Date.now();

        time = currentTime - startTime;

        _time.innerHTML = formatTime(time);
    }, 1);
}

// "moment" kütüphanesini kullanarak zamanın değerlerini
// okunabilir şekilde alıyoruz.
function formatTime (time) {
    const duration = moment.duration(time);

    let hours = duration.hours();
    let minutes = duration.minutes();
    let seconds = duration.seconds();
    let milliseconds = duration.milliseconds();

    const withZero = function (t) {
        if (t < 10) {
            return '0' + t;
        }

        return t;
    }

    return withZero(hours) + '::' + withZero(minutes) + '::' + withZero(seconds) + '::' + milliseconds;
}

// "Durdur" butonuna tıklandığında geçen süreyi durduruyor
// ve gerekli tüm butonları ve inputları aktif ediyoruz.
function stop () {
    if (timeInterval) {
        clearInterval(timeInterval);
    }

    started = false;

    bSolve.innerText = 'Başlat';

    attemptInput.removeAttribute('disabled');
    bShuffle.removeAttribute('disabled');
    bReset.removeAttribute('disabled');
    bSolvable.removeAttribute('disabled');
}

// "Çöz" butonuna tıklandığında algoritmamız çalışarak
// ilgili matrix'i çözmeyi sağlayacak fonksiyonumuz
async function solve () {
    // Eğer program daha önceden başlatılmış ise yani "Durdur"
    // butonu olarak ekranda yansıtılıyorsa çözme işlemini durduruyoruz
    if (started) {
        stop();

        return;
    } else {
        // Eğer program ilk defa çalıştırılıyorsa veya tekrar başlatılmak
        // istenildiyse süreyi başlatıyoruz.
        start();
    }

    // Mevcut değiştirilmiş matrix'in H değerini hesaplıyoruz
    let h = calculateHeuristic(current);
    // H ve G değerlerini birleştirerek F değerimizi belirliyoruz
    let f = g + h;

    // Algoritmanın çalışması için bir döngü oluşturuyoz.
    while (true) {
        // Eğer "Durdur" butonuna tıklandıysa döngümüzden çıkıyoruz.
        if (!started) {
            break;
        }

        // Mevcut deneme sayısı, belirlenen deneme sayısından küçük veya eşit
        // olduğunda döngüden çıkıyoruz ve belirlenen deneme sayısna kadar
        // bir çözüm sağlanmadığını anlıyoruz.
        if (attempts <= g) {
            unsolved();

            return false;
        }

        // Mevcut matrix hedef matrix ile aynı ise çözüm sağlanmıştır.
        // Döngüyü sonlandırıyoruz
        if (solved(current)) {
            break;
        }

        // Arama algoritmasını kullanıyoruz ve parametre olarak en son
        // değişen matrix'i, G ve F değerlerini gönderiyoruz.
        const result = await search(current, g);

        current = _.cloneDeep(result.state);
        f = result.f;
        g = result.g;
        h = result.h;

        attemptsDiv.textContent = 'Toplam Deneme : ' + g;

        // Her döngü sonunda değişen matrix'i tablomuzda gösteriyoruz
        draw(current);
    }

    // Döngüden çıktığımızda zamanı durduruyoruz.
    stop();
}

// Çözüm sağlanmadığında bir uyarı veriyoruz
function unsolved () {
    stop();

    alert('Çözüm sağlanamadı !');
}

// Arama fonksiyonunda parametre olarak verilen matrix'i
// hareket yönüne göre değiştiriyor ve güncel matrix'i geri yolluyoruz.
function moveIt (type, board) {
    let position = [0, 0];

    switch (type) {
        case 'up':
            position = [-1, 0]
            break;
        case 'down':
            position = [1, 0]
            break;
        case 'right':
            position = [0, 1]
            break;
        case 'left':
            position = [0, -1]
            break;
        default:
            break;
    }

    // Verilen matrix'in haraket karakterinin
    // x ve y konumlarını buluyoruz.
    let cP = cursorPosition(board);

    // Hareket yönüne göre değiştirilen
    // x ve y konumunu alıyoruz.
    let x = cP[0] + position[0];
    let y = cP[1] + position[1];

    // Matrix'i başka bir değişkene taşıyoruz.
    let data = _.cloneDeep(board);

    // Hareket yönüne göre yer değiştirilecek olan
    // değeri sabit bir değişkene atıyoruz.
    const temp = data[x][y];

    // Eski konumdaki değeri, karakter ile değiştiriyoruz.
    data[x][y] = cursor;

    // Yeni konumdaki değeri, eski konumdaki değer ile değiştiriyoruz.
    data[cP[0]][cP[1]] = temp;

    return data;
}

let lastStep = null;

// Arama algoritmasını uygulama fonksiyonumuz
function search (state, g) {
    // Haraket ettirdiğimiz konuma göre oluşan matrixleri
    // tutacağımız yığınımız.
    let states = [];

    // Parametre olarak alınan matrix'i değiştirmemek için
    // sabit bir değişkene aktarıyoruz.
    const d = _.cloneDeep(state);

    // Eğer alınan matrixde yukarı haraket ettirebiliyorsa,
    // haraket ettir ve bunu yığına ekle.
    if (canUp(d)) {
        states.push({
            state: moveIt('up', d),
            dir: 'up'
        });
    }

    // Eğer alınan matrixde sola haraket ettirebiliyorsa,
    // haraket ettir ve bunu yığına ekle.
    if (canLeft(d)) {
        states.push({
            state: moveIt('left', d),
            dir: 'left'
        });
    }

    // Eğer alınan matrixde aşağıya haraket ettirebiliyorsa,
    // haraket ettir ve bunu yığına ekle.
    if (canDown(d)) {
        states.push({
            state: moveIt('down', d),
            dir: 'down'
        });
    }

    // Eğer alınan matrixde sağa haraket ettirebiliyorsa,
    // haraket ettir ve bunu yığına ekle.
    if (canRight(d)) {
        states.push({
            state: moveIt('right', d),
            dir: 'right'
        });
    }

    // Global değişken olan haraket toplam değerini arttır
    g += 1;

    // Yığın dizisini tek tek inceleyip ilgili matrix'in
    // Heuristic değerini hesaplatarak, aralarında en küçük
    // H değerine sahip olana göre sıralama yapıyoruz
    const sortedStates = states.map(obj => {
        const H = calculateHeuristic(obj.state);
        const F = g + H;

        return { ...obj, f: F, h: H };
    }).sort((a, b) => {
        return a.f - b.f;
    });

    // Sıralamaya göre yığından en küçük olan ilk elemanı seçiyoruz
    let final = _.cloneDeep(sortedStates[0]);

    let nextIndex = 1;

    /**
     * Eğer seçtiğimiz matrix durumu daha önce kontrol edilip havuza
     * eklenmiş ise bir sonraki durumu kontrol ediyoruz.
     *
     * Bunun yapma sebebim, ilgili yığın içerisinde H değerleri bir birine eşit olduğunda
     * döngümüz sonsuz döngüye girmiş oluyor. Bu nedenle eğer matrix havuzda mevcut ise
     * bir sonraki index (nextIndex) de bulunan matrixi kontrol ediyoruz.
     */
    while (addInPool(final.state) && Boolean(sortedStates[nextIndex])) {
        final = _.cloneDeep(sortedStates[nextIndex]);

        nextIndex += 1;
    }

    // Promise sınıfını kullanarak sonuçları ekranda bıraz geçikmeli görmek için
    // asenkron bir şekilde gönderiyoruz.
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            resolve({
                state: final.state,
                dir: final.dir,
                f: final.f,
                g: g,
                h: final.h
            });
        }, 100);
    })
}

// Gönderilen matrixin havuzda olup olmadığını kontrol eden ve
// eğer havuzda yok ise ekleyen fonksiyonumuz
function addInPool (s) {

    // Alınan matrix'in havuzda olup olmadığını
    // kontrol eden durum değişkeni
    let hasState = pool.findIndex(el => {
        return JSON.stringify(el) == JSON.stringify(s);
    }) !== -1;

    if (hasState) {
        return true;
    }

    pool.push(s);

    return false;
}

// Heuristic değerini hesaplayan fonksiyonumuz.
function calculateHeuristic (board) {
    let value = 0;

    // Alınan matrix'i her satır ve stününü
    // gezerek ilgili x ve y konumlarını kontrol ediyoruz.
    board.forEach((row, i) => {
        row.forEach((col, j) => {
            // Eğer ilgili değer "cursor" değerine eşit değil ise
            // konumlar arası mesafeyi ölçüp toplam değerleri
            // "value" değişkenine aktarılacaktır.
            if (board[i][j] !== cursor) {
                // Parametre olarak alınan matrixdeki değere göre
                // hedef matrix deki değerin olduğu konumu alıyoruz
                // x = positions[0]
                // y = positions[1]
                let positions = goal_statePosition(board[i][j]);

                // Döngüdeki x değeri ve hedef matrixdeki x değeri farkını hesaplıyoruz
                let x = Math.abs(positions[0] - i);
                // Döngüdeki y değeri ve hedef matrixdeki y değeri farkını hesaplıyoruz
                let y = Math.abs(positions[1] - j);

                // Toplam değerleri hesaplayıp "value" değişkenine aktarıyoruz
                value += (x + y);
            }
        });
    });

    return value;
}

// Klavye hareketlerini algılayarak
// başlangıç matrix'i düzenlemeye yarayan fonksiyonumuz
function move (event) {
    // Çözme işlemi başlatıldıysa klavye hareketlerine izin verme.
    if (started) {
        return;
    }

    let result = false;

    let d = current;

    if (event.which === 38) {
        result = up(d);
    } else if (event.which === 40) {
        result = down(d);
    } else if (event.which === 39) {
        result = right(d);
    } else if (event.which === 37) {
        result = left(d);
    }

    if (result !== false) {
        current = _.cloneDeep(result);
        g = 0;
    }

    draw(current);

}

// Parametre olarak alınan matrix de bulunan hareket karakterinin
// yerini yukarıya taşıyoruz. Eğer hareket ettirilebiliyorsa.
function up (board) {
    if (!canUp(board)) {
        return false;
    }

    let position = cursorPosition(board);

    let temp = board[position[0] - 1][position[1]];

    board[position[0] - 1][position[1]] = cursor;
    board[position[0]][position[1]] = temp;

    return board;
}


// Parametre olarak alınan matrix de bulunan hareket karakterinin
// yerini sola taşıyoruz. Eğer hareket ettirilebiliyorsa.
function left (board) {
    if (!canLeft(board)) {
        return false;
    }

    let position = cursorPosition(board);

    let temp = board[position[0]][position[1] - 1];

    board[position[0]][position[1] - 1] = cursor;
    board[position[0]][position[1]] = temp;

    return board;
}


// Parametre olarak alınan matrix de bulunan hareket karakterinin
// yerini sağa taşıyoruz. Eğer hareket ettirilebiliyorsa.
function right (board) {
    if (!canRight(board)) {
        return false;
    }

    let position = cursorPosition(board);

    let temp = board[position[0]][position[1] + 1];

    board[position[0]][position[1] + 1] = cursor;
    board[position[0]][position[1]] = temp;

    return board;
}


// Parametre olarak alınan matrix de bulunan hareket karakterinin
// yerini aşağıya taşıyoruz. Eğer hareket ettirilebiliyorsa.
function down (board) {
    if (!canDown(board)) {
        return false;
    }

    let position = cursorPosition(board);

    let temp = board[position[0] + 1][position[1]];

    board[position[0] + 1][position[1]] = cursor;
    board[position[0]][position[1]] = temp;

    return board;
}

// Parametre olarak alınan matrix de hareket imlecinin
// konumunu x ve y kordinatı olarak alıyoruz.
function cursorPosition (board) {

    for (var i = 0; i < board.length; i++) {
        var index = board[i].indexOf(cursor);

        if (index > -1) {
            return [i, index];
        }
    }
}

// Parametre olarak alınan tablo değerini hedef matrix'inde
// bulunan konumunu x ve y kordinatı olarak alıyoruz.
function goal_statePosition (value) {

    for (var i = 0; i < goal_state.length; i++) {
        var index = goal_state[i].indexOf(value);

        if (index > -1) {
            return [i, index];
        }
    }
}

// Tablo içeriğin sıfırlıyor.
function clear () {
    table.innerHTML = null;
    tBody.innerHTML = null;
    _board.innerHTML = null;
}

// Parametre olarak alınan matrix'i tablo olarak ekranda yansıtıyor.
function draw (board) {
    // İlk olarak içeriğin hepsini siliyoruz.
    clear();

    // Matrix'in her elmanını gezmek için döngüye alıyoruz
    board.forEach(row => {
        // Satır oluşturur.
        let tRow = document.createElement('tr');

        // Matrix'deki tüm satırları döngüye alıyoruz
        row.forEach(col => {
            // Stün oluşturur
            let tCol = document.createElement('td');

            // Stün içine yazıyı yazman için "span" elementi oluşturuyoruz.
            let span = document.createElement('span');

            // Stün değerini yazıyoruz
            span.innerHTML = col;

            // Stün içine yazıyı ekliyoruz
            tCol.appendChild(span);

            // Satır içine stün ekleniyor
            tRow.appendChild(tCol);
        })

        // Tablo gövde elemanına satır elamanı ekleniyor.
        tBody.appendChild(tRow);
    });

    // Tabloya gövde elemanı ekleniyor
    table.appendChild(tBody);

    // Tablo oluşturulduktan sonra ilgili alana basılıyor.
    _board.appendChild(table);
}


function canLeft (board) {
    let position = cursorPosition(board);

    // Eğer "cursor" pozisyonu en solda ise haraket ettirilmiyecek
    let result = position[1] !== 0;

    return result;
}

function canRight (board) {
    let position = cursorPosition(board);

    // Eğer "cursor" pozisyonu en sağda ise haraket ettirilmiyecek
    let result = position[1] !== (board[0].length - 1);

    return result;
}


function canUp (board) {
    let position = cursorPosition(board);

    // Eğer "cursor" pozisyonu en üstte ise haraket ettirilmiyecek;
    let result = position[0] !== 0;

    return result;
}

function canDown (board) {
    let position = cursorPosition(board);

    // Eğer "cursor" pozisyonu en altta ise haraket ettirilmiyecek;
    let result = position[0] !== (board.length - 1);

    return result;
}
