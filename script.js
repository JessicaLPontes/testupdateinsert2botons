document.addEventListener("DOMContentLoaded", function () {
    // Seleciona os elementos
    const body = document.body;
    const themeToggle = document.getElementById("theme-toggle").querySelector("i");

    // Aplicar o tema salvo no LocalStorage ao carregar a página
    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
        themeToggle.classList.remove("fa-sun");
        themeToggle.classList.add("fa-moon");
    } else {
        body.classList.remove("dark-mode");
        themeToggle.classList.remove("fa-moon");
        themeToggle.classList.add("fa-sun");
    }

    // Função para alternar entre modo escuro e claro
    window.toggleTheme = function () {
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
    };

    // Função para limpar os arquivos carregados
    window.clearFiles = function () {
        document.getElementById("insert-input").value = "";
        document.getElementById("update-input").value = "";
        document.getElementById("insert-sql-links").innerHTML = "";
        document.getElementById("update-sql-links").innerHTML = "";
    };
});

// Função para processar arquivos de INSERT e UPDATE
function handleInsertFiles(event) {
    processFiles(event, 'INSERT');
}

function handleUpdateFiles(event) {
    processFiles(event, 'UPDATE');
}

function processFiles(event, mode) {
    const files = event.target.files;

    if (!files || files.length === 0) {
        alert('Por favor, selecione pelo menos um arquivo.');
        return;
    }

    const sqlLinksContainer = document.getElementById(
        mode === 'INSERT' ? 'insert-sql-links' : 'update-sql-links'
    );
    sqlLinksContainer.innerHTML = '';

    const processingMsg = document.createElement('p');
    processingMsg.innerText = `Processando arquivos para ${mode}...`;
    processingMsg.classList.add('processing');
    sqlLinksContainer.appendChild(processingMsg);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function(event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                workbook.SheetNames.forEach(sheetName => {
                    const sheet = workbook.Sheets[sheetName];
                    const tableName = sheetName.replace(/\s+/g, '_');
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: false });

                    if (jsonData.length === 0) {
                        throw new Error('A planilha está vazia.');
                    }

                    const columns = Object.keys(jsonData[0]);
                    const sqlCommands = jsonData.map(row => {
                        return mode === 'INSERT' 
                            ? generateInsertSQL(tableName, columns, row) 
                            : generateUpdateSQL(tableName, columns, row);
                    }).join('\n');

                    const blob = new Blob([sqlCommands], { type: 'text/plain' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${tableName}_${mode}.sql`;
                    link.innerText = `Download ${tableName}_${mode}.sql`;
                    link.classList.add('sql-link');
                    sqlLinksContainer.appendChild(link);
                });

                sqlLinksContainer.removeChild(processingMsg);
            } catch (error) {
                console.error(`Erro ao processar arquivo para ${mode}:`, error);
                sqlLinksContainer.removeChild(processingMsg);
                const errorMsg = document.createElement('p');
                errorMsg.innerText = `Erro ao processar arquivo para ${mode}: ${file.name}`;
                errorMsg.classList.add('error');
                sqlLinksContainer.appendChild(errorMsg);
            }
        };

        reader.readAsArrayBuffer(file);
    }
}

// Função para gerar comando SQL INSERT com todos os valores entre aspas
function generateInsertSQL(tableName, columns, row) {
    const values = columns.map(column => formatValue(row[column])).join(', ');
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
}

// Função para gerar comando SQL UPDATE com todos os valores entre aspas
function generateUpdateSQL(tableName, columns, row) {
    const keyColumn = columns[0]; // Primeira coluna do Excel como chave
    const keyValue = row[keyColumn]?.toString().trim();

    if (!keyValue) {
        throw new Error(`A coluna-chave "${keyColumn}" está vazia para algum registro.`);
    }

    const setClauses = columns.slice(1).map(column => `${column} = ${formatValue(row[column])}`).join(', ');
    const whereClause = `${keyColumn} = ${formatValue(row[keyColumn])}`;

    return `UPDATE ${tableName} SET ${setClauses} WHERE ${whereClause};`;
}

// Função para formatar valores corretamente (todos os valores com aspas, incluindo números)
function formatValue(value) {
    if (value === undefined || value === null || value.toString().trim() === '') {
        return 'NULL';
    }

    // Aqui, até os números são convertidos para string e envolvidos por aspas
    return `'${value.toString().trim().replace(/'/g, "''")}'`;
}
