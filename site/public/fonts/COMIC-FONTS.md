# Comic B lettering fonts (sources and licences)

Chosen 2026-09-28 against crops of the reference balloons (discussion/reference-comics/, e.g. the Darkseid page's "YOU WASTE
YOUR BREATH, YOUNGLING."): clean, rounded, hand-inked upper case at a confident medium-bold weight.

| File | Font | Source | Licence |
|---|---|---|---|
| shantell-sans-560.woff2 | Shantell Sans, static instance wght 560, BNCE 0, INFM 0, SPAC 0 (dialogue) | https://github.com/google/fonts/tree/main/ofl/shantellsans (upstream https://github.com/arrowtype/shantell-sans) | SIL OFL 1.1, OFL-shantellsans.txt |
| shantell-sans-760.woff2 | Shantell Sans, wght 760 (bursts' second choice, bold lettering) | as above | SIL OFL 1.1 |
| shantell-sans-760-italic.woff2 | Shantell Sans Italic, wght 760 (bold italic emphasis) | as above | SIL OFL 1.1 |
| kalam-700.woff2 | Kalam Bold (dialogue and captions; Matt's choice 2026-09-30, closest to the references' pen lettering at 15 px; stress = the same face slanted and slightly heavier) | https://github.com/google/fonts/tree/main/ofl/kalam | SIL OFL 1.1, OFL-kalam.txt |
| bangers-400.woff2 | Bangers (bursts and shouts) | https://github.com/google/fonts/tree/main/ofl/bangers | SIL OFL 1.1, OFL-bangers.txt |

Instances made with fontTools varLib.instancer, subset to Latin-1 plus typographic punctuation, saved as woff2. Neither
licence declares a Reserved Font Name (checked 2026-09-28), so these modified instances may keep their names; the CSS
family is 'Shantell Letter'. Comic Neue (comic-neue-*.woff2, OFL-comicneue.txt) was the first
choice and is kept as the fallback in the font stack.


Since 2026-09-30 the dialogue face is Kalam 700 (spec "Comic B: balloons to 95, Kalam lettering"); Shantell Sans stays in the stack as a fallback.
