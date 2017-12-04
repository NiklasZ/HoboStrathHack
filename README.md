HoboStrathHack
==============
This is a 2D multiplayer racing game developed at StrathHack 2015. Its main trait was that it procedurally generated racing track off of stock prices with special effects where appropriate. It originally got this data from the [Bloomberg API](https://www.bloomberg.com/professional/support/api-library/), but has since then switched to using random generation + seeds instead.

To actually play the game, you can download and install using the steps below or play it online [here](https://motomotomoto.herokuapp.com/#!).

**Note:** it also features a "pay $10" feature to unlock some interesting skins, using [Braintree](https://www.braintreepayments.com/en-ch?locale=en-ch), however this is just a gimmick to test out the API. DO NOT put your actual details into this sytem (the data doesn't go anywhere, but it still wouldn't be wise to do it).

Installation
------------

1. Install node using the [Windows installer](http://nodejs.org/download/) or [NVM](https://github.com/creationix/nvm) if you are using Linux.
    - After installing NVM (if you are using it) run `nvm install 0.10`
2. Checkout this git directory and run `npm install`
3. Run `node server`
4. In your browser navigate to [http://localhost:3000](http://localhost:3000)

Authors
------------

* (adikus)[https://github.com/adikus]
* (NiklasZ)[https://github.com/NiklasZ]
* (kstanski)[https://github.com/kstanski]
* (AndreeaLutac)[https://github.com/AndreeaLutac]
