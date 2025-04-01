// Alternar entre modo escuro e claro
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById("theme-toggle").querySelector("i");

    body.classList.toggle("dark-mode");

    if (body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeToggle.classList.remove("fa-sun");
        themeToggle.classList.add("fa-moon");
    } else {
        localStorage.setItem("theme", "light");
        themeToggle.classList.remove("fa-moon");
        themeToggle.classList.add("fa-sun");
    }
}

// Manter tema salvo ao recarregar a página
window.onload = function () {
    const body = document.body;
    const themeToggle = document.getElementById("theme-toggle").querySelector("i");

    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
        themeToggle.classList.remove("fa-sun");
        themeToggle.classList.add("fa-moon");
    } else {
        themeToggle.classList.remove("fa-moon");
        themeToggle.classList.add("fa-sun");
    }
};

// Função para limpar os arquivos carregados
function clearFiles() {
    document.getElementById("insert-input").value = "";
    document.getElementById("update-input").value = "";
    document.getElementById("insert-sql-links").innerHTML = "";
    document.getElementById("update-sql-links").innerHTML = "";
}
