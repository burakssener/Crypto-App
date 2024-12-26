// How we structured our states:
// active = 0 means the page that we choose profiles.
// active = 1 means that individuals account
// there will be users: [] that will store user objects.
//
// Example states:
// states = { active:1, (1 means we are in profiles 0 means we don't have prfile)
//            aciveProfile: 0 (null means you did not choose 0 means first index),
//             // 
//            profiles: [
//                        { name: Gül , wallet : [ {dollar: 1000}, {ada: 0}, {btc: 0.002}], date : '02-01-2021' activeCoin: 'btc' (it shows which coin page we are in))} 
//                       ]
//          }

// 
let states = {}

// Initialize states from the storage
let storedData = localStorage.getItem("states") 
states =  storedData ? JSON.parse( storedData) :  { active: 0, profiles : [], activeProfile: null}
renderPage()

// Everytime we change a part of the states, it updates the page and the storage accordingly
function update() {
    renderPage()  // update the page
    localStorage.setItem("states", JSON.stringify(states))  // update the storage
}

// RENDERING UI PARTS  (top-down approach)
function renderPage() {
    if (states.active == 0) {
        $("#root").html(`
            <main>
              <p><strong>CTIS</strong> Crypto Trading Information System</p>
              <div id="profiles"> 
                ${renderProfiles()} 
              </div>
              <div id="inputs"> 
                <div>
                   <button id="newProfileButton">+ New Profile</button>
                </div>
                <div id="modal" class="hidden">
                    <div id="addProfile" class="modal-content">
                        <p>New Profile</p>
                        <input type="text" id="newProfileInput" name="newProfile">
                        <button type="button" id="addProfileButton">Add</button>
                    </div>
                </div>
              </div>
            </main>
        `);
        
        

        $("#newProfileButton").on("click", function () {
            $("#modal").removeClass("hidden");
        });

        $("#addProfileButton").on("click", function () {
            const newName = $("#newProfileInput").val().trim();
            if (newName) {
                states.profiles.push({ name: newName, wallet: [{dollar: 1000}], date: "02-01-2021",  activeCoin: 'btc' });
                update();
                $("#modal").addClass("hidden");
            }
        });

        $(".cancel-btn").on("click", function () {
            const index = $(this).data("index");
            states.profiles.splice(index, 1);
            update();
        });

        $(".profile-item").on("click", function () {
            const index = $(this).data("index");
            states.active = 1;
            states.activeProfile = index; // Store the active profile index
            update();
        });
    } else if (states.active == 1) {
        const profile1 = states.profiles[states.activeProfile];
        $("#root").html(`
            <main>
                <nav>
                    <p><strong>CTIS</strong> Crypto Trading Information System</p>
                    <div>
                        <strong>${profile1.name}</strong>
                        <button id="backButton">Log Out</button>
                    </div>
                </nav>
                <section>
                    <div class="date">
                        <h1>${profile1.date} </h1>
                    </div>

                    <div class="date_buttons">
                        <button id="nextDay">Next Day</button>
                        <button id="play">Play</button>
                    </div>
                    <div id="wallet">
                        ${renderTable()}
                        <div class="market">
                            ${renderMarket()} 
                        </div>
                    </div>
                </section>
                <footer>
                    <div id = "trading-container"></div>
                    <div id = "wallet-container">  
                        ${renderWallet(profile1)}
                    </div>
                </footer>
            
                
              
            </main>
        `);

        $(".market").html(renderMarket());

        $('.candlestick-container').on('mouseenter', function() {

            const index = $(this).data("index");
            const marketData = states.market_todate[index];
            $("#active_coin_data").css("visibility", "visible");
    
            if (marketData) {
                $("#active_coin_data").text(`Date: ${marketData.date} Open: ${marketData.open} Close: ${marketData.close} High: ${marketData.high} low: ${marketData.low} `);
            }
        });

        $('.candlestick-container').on('mouseleave', function() {

            $("#active_coin_data").css("visibility", "hidden");
        });
        
        

        $("#backButton").on("click", function () {
            states.active = 0;
            states.activeProfile = null;
            update();
        });

        $(".coin_item").on("click", function () {
            states.profiles[states.activeProfile].activeCoin = $(this).attr("name");
            update();
        });

        $("#nextDay").on("click", function () {
            // Parse the current date string into a Date object
            let currentDate = new Date(states.profiles[states.activeProfile].date.split('-').reverse().join('-'));
        
            // Increment the date by one day
            currentDate.setDate(currentDate.getDate() + 1);
        
            // Format it back to 'DD-MM-YYYY'
            const incrementedDate = currentDate.toISOString().split('T')[0].split('-').reverse().join('-');
        
            // Update the profile date in states
            states.profiles[states.activeProfile].date = incrementedDate;
        
            update(); // Re-render the page with updated state
        });
    }
}
function renderMarket() {
    const market_todate = [];
    const profile = states.profiles[states.activeProfile];
    const activeCoin = profile.activeCoin;

    const profileDate = new Date(profile.date.split('-').reverse().join('-'));
    const startDate = new Date(profileDate);
    startDate.setDate(startDate.getDate() - 120);

    for (let m of market) {
        const marketDate = new Date(m.date.split('-').reverse().join('-'));

        if (marketDate >= startDate && marketDate <= profileDate) {
            const coinData = m.coins.find((coin) => coin.code === activeCoin);
            if (coinData) {
                market_todate.push({ date: m.date, ...coinData });
            }
        }
    }

    // Store in global state
    states.market_todate = market_todate;

    if (market_todate.length === 0) {
        return "<p>No market data available for the selected coin.</p>";
    }

    const marketMinLow = Math.min(...market_todate.map((m) => m.low));
    const maxRange = Math.max(...market_todate.map((m) => m.high - m.low));
    const chartHeight = $(".market").height();
    const scaleFactor = (chartHeight / maxRange) * 0.2;

    let x = 0;
    let out = "";

    market_todate.forEach((data, i) => {
        let stickHeight = (data.high - data.low) * scaleFactor;
        let barHeight = Math.abs(data.open - data.close) * scaleFactor;
        let barPos = (Math.min(data.open, data.close) - marketMinLow) * scaleFactor;
        let normalizedLow = (data.low - marketMinLow) * scaleFactor;
        let color = data.open < data.close ? "green" : "red";

        out += `
            <div class="candlestick-container" style="left:${x}px;" data-index="${i}">
                <div class='stick' style='height:${stickHeight}px; bottom:${normalizedLow}px;'></div>
                <div class='bar' style='background:${color}; bottom:${barPos}px; height:${barHeight}px;'></div>
            </div>
        `;

        x += 10;
    });

    // Add the dotted line for the latest (most recent) close price
    const latestData = market_todate[market_todate.length - 1];
    if (latestData) {
        const latestClosePos = (latestData.close - marketMinLow) * scaleFactor;
        out += `
            <div class="latest-price-line" style=" bottom: ${latestClosePos}px;">
                <span class="latest-price-label">${latestData.close}</span>
            </div>
        `;
    }

    return out;
}


  
function renderTable()
{
    let out = `<div class="coin_container"><ul>`;

    let i = 0;
    for(let coin of coins)
    {
        out += `<li class="coin_item" name="${coin.code}"> <img src="./images/${coin.code}.png"></img></li>`     
    }

    out += `</ul>`;

    out += `</div>`;

    const profile = states.profiles[states.activeProfile];

    out += `<div id="active_coin"> 
                <img src="./images/${profile.activeCoin}.png" >
                <div>${profile.activeCoin}</div>
                <div id="active_coin_data"></div>
            </div>`;

    return out;
        
}

function renderProfiles() {
    let out = "";
    if (states.profiles.length !== 0) {
        out += "<ul>";
        for (let i = 0; i < states.profiles.length; i++) {
            out += `
              <li class="profile-item" data-index="${i}">
                 <button class="cancel-btn" data-index="${i}">&times;</button>
                 <i class="fas fa-user user-icon"></i>
                 <span>${states.profiles[i].name}</span>
              </li> 
              `;
        }
        out += "</ul>";
    } else {
        out += "<p class='center empty'>Empty</p>";
    }
    return out;
}



function renderWallet(profile) {
    let out = `
        <table class="wallet-table">
            <thead>
                <tr>
                    <th>Coin</th>
                    <th>Amount</th>
                    <th>Subtotal</th>
                    <th>Last Close</th>
                </tr>
            </thead>
            <tbody>
    `;

    // First row for dollar balance (highlighted row)
    const dollarBalance = profile.wallet.find(item => item.dollar);
    if (dollarBalance) {
        out += `
            <tr class="highlight-row">
                <td>Dolar</td>
                <td>$${parseFloat(dollarBalance.dollar).toFixed(4)}</td>
                <td></td>
                <td></td>
            </tr>
        `;
    }

    // Other coins
    profile.wallet.forEach((item) => {
        const [coin, amount] = Object.entries(item)[0];
        if (coin !== 'dollar') {
            const marketData = states.market_todate.find((m) => m.code === coin);
            const lastClose = marketData ? marketData.close : "N/A";
            const subtotal = marketData ? (amount * lastClose).toFixed(2) : "N/A";

            out += `
                <tr>
                    <td>${coin.charAt(0).toUpperCase() + coin.slice(1)}</td>
                    <td>${amount.toFixed(6)}</td>
                    <td>${subtotal}</td>
                    <td>${lastClose}</td>
                </tr>
            `;
        }
    });

    out += `
            </tbody>
        </table>
    `;

    return out;
}
