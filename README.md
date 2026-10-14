# S.C.O.P.E. v2

## What is SCOPE?

SCOPE is a discordJS bot that support the **Specific Calculation of Power (for) EiTS...** Or... more specifically, it's a discord bot that provides multiple functions to increase the decision making processes of players in [Visual-Utopia, _"A massively multi player strategy war game!"_ built in the early 2000s and rarely updated](https://visual-utopia.com).

Built with ❤️ by [@CTFries](https://github.com/ctfries)

## What commands does SCOPE have, and how do they work?

- army
  - description _Provides the OP & DP of given troops_
  - arguments
    - required
      - race _select_
      - military _select_
      - magic _select_
      - t1 _int_
      - t2 _int_
      - t3 _int_
      - t4 _int_
      - t5 _int_
    - optiona
      - moral _int_
      - bless _int_
      - xp _int_
- attack
  - description _Paste, post message, then call_
  - arguments
    - optional
      - visible _select_
- battlecalc
  - description _Takes OP and DP, gives % chance_
  - arguments
    - required
      - op - Attacking army OP _int_
      - dp - Defedning army DP _int_
    - optional
      - visible _select_
- dropcalc
  - description _Estimate time until resources acquired for Land Drop assuming no market interaction._
  - arguments
    - required
      - buildings _int_
      - goldcost _int_
      - stonecost _int_
      - woodcost _int_
      - goldreserve _int_
      - stonereserve _int_
      - woodreserve _int_
      - goldprod _int_
      - stoneprod _int_
      - woodprod _int_
      - stoneprice _int_
    - optional
      - visible _select_
- eits

  - description _Calculates the OP/DP of EITS results, must paste the results THEN immediately call the bot_
  - arguments
    - required
      - military _select_
      - magic _select_
    - optional
      - visible _select_

- math
  - description _Does basic math operations, rounded to 2 decimal places_
  - arguments
    - required
      - firstitem _number_
      - operator _select_
      - seconditem _number_
    - optional
      - title _string_
- ping
  - description _**PONG!**_
- prep
  - description _Determines max prep based on city visual size and troop counts._
  - arguments
    - required
      - t1 _int_
      - t2 _int_
      - t3 _int_
      - t4 _int_
      - t5 _int_
      - size _select_
- prune
  - description _Prune up to 99 messages_ _(Must have permissions to manage messages on the server to execute)_
  - arguments
    - required
      - amount _int_
- range
  - description _Determine MT range given X MTs, or find MTs needed to reach Y range._
  - arguments
    - required
      - race _select_
    - optional
      - mts _int_
      - distance _int_
      - visible _int_
- remind
  - description _Bot will @ you with your message after X hours and Y minutes_
  - arguments
    - required
      - hours _int_
      - minutes _int_
      - noti _string_
    - optional
      - visible _select_
- reminddelete
  - description _Delete upcoming reminders. Run /remindlist first._
  - arguments
    - required
      - entry _int_
- remindlist
  - description _List upcoming reminders you have set_
- server
  - description _Display info about this server._

## I want scope on my Visual-Utopia discord server, how do I do that?

Fire up a nodejs service (or the Docker image) with this repo, create a bot via the Discord developer portal, capture a token and client id, then copy `.env.example` to `.env` and fill it in.

Then invite it to your VU server.

## License

[MIT](LICENSE)
