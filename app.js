/*
Burak Şener,
Ahmet Canpolat,
Berkay Doğan,
Erdem Gözen,
Ulaş Çete
*/
// Structure of states:
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
var timer = null;

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
              <p><strong>CTIS</strong> Crypto Trading Information System
              <p id="group_names">
                        <strong>Contributors:</strong>
                        Burak Şener,
                        Ahmet Canpolat,
                        Berkay Doğan,
                        Erdem Gözen,
                        Ulaş Çete
              </p>
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
                    <div id="user_info">
                        <img src="./images/user.png">
                        <strong>${profile1.name}</strong>
                        <button id="backButton">Log Out</button>
                </nav>
                <section>
                    <div class="date">
                        <h1> Day ${calculateDayDifference(states.profiles[states.activeProfile].date, '1-01-2021')} </h1>
                    </div>
                    <div class="date">
                        <h1>${profile1.date} </h1>
                    </div>

                    <div class="date_buttons">
                        <button id="nextDay">Next Day</button>
                        <button id="play">
                        <img src = "./images/${timer == null ? "play" : "pause"}.png">
                        <span>${timer == null ? "Play" : "Stop"}</span>
                        </button>
                    </div>
                    <div id="wallet">
                        <div class="market-container">
                                ${renderTable()}
                            <div class="market">
                                ${renderMarket()} 
                            </div>
                        </div>
                    </div>
                </section>
                <h1 id="wallet-header">$${renderWallet(profile1).totalWalletValue.toFixed(2)}</h1>
                <footer>
                    <div id = "trading-container">
                        ${renderTrading()}
                    </div>
                    <div id = "wallet-container">  
                        ${renderWallet(profile1).html}
                    </div>
                </footer>
            
                
              
            </main>
        `);


        $("#buyButton").on("click", function () {
            $("#buyButton").addClass("active buy-button");
            $("#sellButton").removeClass("active sell-button");
            $("#tradeButton").text(`Buy ${states.profiles[states.activeProfile].activeCoin.toUpperCase()}`);
            $("#tradeButton").removeClass("sell").addClass("buy");
        });
        
        $("#sellButton").on("click", function () {
            $("#sellButton").addClass("active sell-button");
            $("#buyButton").removeClass("active buy-button");
            $("#tradeButton").text(`Sell ${states.profiles[states.activeProfile].activeCoin.toUpperCase()}`);
            $("#tradeButton").removeClass("buy").addClass("sell");
        });
        
        $("#amountInput").on("input", function () {
            const amount = parseFloat($(this).val()) || 0;
            const activeCoin = states.profiles[states.activeProfile].activeCoin;
            const MarketData = market.find((entry) => entry.date === states.profiles[states.activeProfile].date);
            price = MarketData.coins.find((coin) => coin.code === activeCoin).close;
            const totalValue = (amount * price).toFixed(2);
        
            $("#dollarValue").text(`= $${totalValue}`);
        });
        

        $(".market").html(renderMarket());

        $('.candlestick-container').on('mouseenter', function () {
            const index = $(this).data("index"); // Get the index from the candlestick container
            const marketData = market[index]; // Use the index to access the corresponding market data entry
        
            if (!marketData) {
                console.error("No market data found for index:", index);
                return;
            }
        
            // Find the active coin data
            const profile = states.profiles[states.activeProfile];
            const coinData = marketData.coins.find((coin) => coin.code === profile.activeCoin);
        
            if (!coinData) {
                console.error("No coin data found for the active coin:", profile.activeCoin);
                return;
            }
        
            // Display the data 
            $("#active_coin_data").css("visibility", "visible").text(
                `Date: ${marketData.date} Open: ${coinData.open} Close: ${coinData.close} High: ${coinData.high} Low: ${coinData.low}`
            );
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
            
            incCounter();
        });

    
        function incCounter() {

            if(calculateDayDifference(states.profiles[states.activeProfile].date, '1-01-2021') < 365)
            { 

                let currentDate = new Date(states.profiles[states.activeProfile].date.split('-').reverse().join('-'));
        
                currentDate.setDate(currentDate.getDate() + 1);
            
                // Format it back to 'DD-MM-YYYY'
                const incrementedDate = currentDate.toISOString().split('T')[0].split('-').reverse().join('-');
            
                // Update the profile date in states
                states.profiles[states.activeProfile].date = incrementedDate;
        
                
                update();
            }
            else
            {
                if( ! $("#wallet-header").hasClass("wallet_heartbeat"))
                {
                    $("#wallet-header").addClass("wallet_heartbeat");
                    $("#trading-container").remove();
                    $("#wallet-header").after(`<h3 style = "text-align:center;">Wallet</h3>`);

                }

                
                
            }
        
           
          }



         
          $("#play").on("click", function(){
             if ( timer === null) {
                timer = setInterval(incCounter, 699);
                
             } else {
                clearInterval(timer)
                timer = null ; 
                update();
                
             }
          })






        $("#tradeButton").on("click", function () {
            const profile = states.profiles[states.activeProfile];
            const activeCoin = profile.activeCoin;
            const amount = parseFloat($("#amountInput").val());
            price = market.find((entry) => entry.date === profile.date).coins.find((coin) => coin.code === activeCoin).close;

            
        
        
        
            const isBuying = $("#buyButton").hasClass("active");
            const dollarBalance = profile.wallet.find(item => item.dollar);
            const coinBalance = profile.wallet.find(item => item[activeCoin]) || { [activeCoin]: 0 };
        
            if (isBuying) {
                // BUY
                const totalCost = amount * price;
        
                if (dollarBalance && dollarBalance.dollar >= totalCost) {
                    dollarBalance.dollar -= totalCost;
                    coinBalance[activeCoin] = (coinBalance[activeCoin] || 0) + amount;
        
                    if (!profile.wallet.includes(coinBalance)) profile.wallet.push(coinBalance);
        
                    alert(`Bought ${amount} ${activeCoin} for $${totalCost.toFixed(2)}`);
                } 
                else
                {
                    alert(`Your balance is not enough!!`);
                }
            } else {
                // SELL
                if (coinBalance && coinBalance[activeCoin] >= amount) {
                    coinBalance[activeCoin] -= amount;
                    dollarBalance.dollar += amount * price;
        
                    alert(`Sold ${amount} ${activeCoin} for $${(amount * price).toFixed(2)}`);
                } 
                else
                {
                    alert(`You don't have specified amoun of coin!!`);
                }
            }
        
            update(); // Update UI and wallet
        });
        
        
    }
}



function calculateDayDifference(currentDateStr, startDateStr) {
    const currentDate = new Date(currentDateStr.split('-').reverse().join('-')); // Convert 'DD-MM-YYYY' 
    const startDate = new Date(startDateStr.split('-').reverse().join('-')); // Convert 'DD-MM-YYYY' 
    const differenceInTime = currentDate - startDate; 
    const differenceInDays = Math.floor(differenceInTime / (1000 * 60 * 60 * 24)); 
    return differenceInDays + 1; 
}
function renderTrading() {
    const profile = states.profiles[states.activeProfile];
    const activeCoin = profile.activeCoin.toUpperCase();

    
    const $container = $("<div>").addClass("trading-container");

   
    $container.append($("<h3>").text("Trading").css("text-align", "center"));

    // Buy/Sell toggle buttons
    $container.append(
        $("<div>")
            .addClass("trading-buttons")
            .append(
                $("<button>").attr("id", "buyButton").addClass("buy-button active").text("Buy"),
                $("<button>").attr("id", "sellButton").addClass("sell-button").text("Sell")
            )
    );

    // Input for amount and dynamic price
    $container.append(
        $("<div>")
            .addClass("trading-inputs")
            .append(
                $("<input>")
                    .attr({ type: "number", id: "amountInput", placeholder: "Amount" })
                    .addClass("amount-input"),
                $("<span>").attr("id", "dollarValue").text("= $0")
            )
    );

    $container.append(
        $("<div>")
            .addClass("trading-action")
            .append(
                $("<button>")
                    .attr("id", "tradeButton")
                    .addClass("trade-button buy")
                    .text(`Buy ${activeCoin}`)
            )
    );

    return $container.prop("outerHTML");
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

    if (market_todate.length === 0) {
        return "<p>No market data available for the selected coin.</p>";
    }

    const chartHighestValue = (Math.max(...market_todate.map((m) => m.high) ) * 1.3).toFixed(2); // Highest high
    const chartLowestValue = (Math.min(...market_todate.map((m) => m.low) ) * 0.7).toFixed(2); // Lowest low

    const marketMinLow = chartLowestValue;
    const maxRange = chartHighestValue - chartLowestValue;
    const chartHeight = $(".market").height();
    const scaleFactor = chartHeight / maxRange;

    let x = 0;
    let out = "";

    // Generate candlesticks
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
    const latestData = market_todate[market_todate.length - 1];
    if (latestData) {
        const latestClosePos = (latestData.close - marketMinLow) * scaleFactor;
        out += `
            <div class="latest-price-line" style="bottom: ${latestClosePos}px;">
                <span class="latest-price-label">${latestData.close}</span>
            </div>
        `;
    }

    // Add the top of chart (highest value)
    out += `
        <div class="dotted-line chart-high-line" style="bottom: ${chartHeight}px;">
            <span class="line-label">$${chartHighestValue}</span>
        </div>
    `;

    // Add the bottom of chart (lowest value)
    out += `
        <div class="dotted-line chart-low-line" style="bottom: 0px;">
            <span class="line-label">$${chartLowestValue}</span>
        </div>
    `;

    return out;
}



  
function renderTable()
{
    let out = `<div class="coin_container"><ul>`;

    let i = 0;
    for(let coin of coins)
    {
        if(coin.code == states.profiles[states.activeProfile].activeCoin)
        {
            out += `<li class="coin_item" name="${coin.code}" id="animated_coin"> <img src="./images/${coin.code}.png"></img></li>`;
        }
        else
        {
            out += `<li class="coin_item" name="${coin.code}"> <img src="./images/${coin.code}.png"></img></li>`;
        }
       
    }

    out += `</ul>`;

    out += `</div>`;

    const profile = states.profiles[states.activeProfile];

    out += `<div id="active_coin"> 
                <br>
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
    let totalWalletValue = 0; // Initialize total wallet value
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

    const dollarBalance = profile.wallet.find(item => item.dollar);
    if (dollarBalance) {
        const dollarAmount = parseFloat(dollarBalance.dollar);
        totalWalletValue += dollarAmount;

        out += `
            <tr class="highlight-row">
                <td>Dollar</td>
                <td>$${dollarAmount.toFixed(2)}</td>
                <td></td>
                <td></td>
            </tr>
        `;
    }

    // Find the market data for the profile's date
    const marketData = market.find((entry) => entry.date === profile.date);

    // If no market data is found, error
    if (!marketData) {
        console.error("No market data found for date:", profile.date);
        out += `
            <tr>
                <td colspan="4">No market data available for ${profile.date}</td>
            </tr>
        `;
        out += `</tbody></table>`;
        return { totalWalletValue, html: out };
    }

    // Process coins in the profile's wallet
    profile.wallet.forEach((item) => {
        const [coin, amount] = Object.entries(item)[0];
        if (coin !== 'dollar') {
            const coinMarketData = marketData.coins.find((m) => m.code === coin);

            // If no market data is found for the coin, skip it
            if (!coinMarketData ) {
                console.error("No market data found for coin:", coin);
                return;
            }

            const lastClose = coinMarketData.close;
            const subtotal = amount * lastClose; // Calculate subtotal in dollars
            totalWalletValue += subtotal; // Add to total wallet value

            if(amount != 0.0)
            {
                out += `
                <tr>
                    <td>${coin.charAt(0).toUpperCase() + coin.slice(1)}</td>
                    <td>${amount.toFixed(2)}</td>
                    <td>${subtotal.toFixed(2)}</td>
                    <td>${lastClose}</td>
                </tr>
            `;
            }
            
        }
    });

    out += `
            </tbody>
        </table>
    `;

    return { totalWalletValue, html: out };
}
