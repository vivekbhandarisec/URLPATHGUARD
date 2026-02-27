Toh yeh 1 pattern hai, jo reGex kii madat se bana hai jo ki XSS ko detect krta hai url logs ke andar
In simple words this is an pattern which is made by using Regular expression for detecting XSS inside url logs

pattern = r"(<script.*?>.*?</script>|"
    r"javascript:|"
    r"on\w+\s*=|"
    r"<svg.*?>|"
    r"<img.*?onerror=.*?>)"

    
