Toh yeh 1 pattern hai, jo reGex kii madat se bana hai jo ki SQLinjection ko detect krta hai url logs ke andar
In simple words this is an pattern which is made by using Regular expression for detecting SQLinjection inside url logs
pattern = ('|\bOR\b|\bAND\b|--|\bUNION\b|\bSELECT\b)

\bOR\b --> [OR]
\b = boundary limit
ORDER will not detect

| --> +