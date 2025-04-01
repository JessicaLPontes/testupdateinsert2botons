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

// Função para gerar comando SQL INSERT
function generateInsertSQL(tableName, columns, row) {
    const values = columns.map(column => formatValue(row[column])).join(', ');
    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
}

// Função para gerar comando SQL UPDATE com a primeira coluna como chave primária
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

// Função para formatar valores corretamente (números sem aspas, textos com aspas)
function formatValue(value) {
    if (value === undefined || value === null || value.toString().trim() === '') {
        return 'NULL';
    }
    if (!isNaN(value) && value !== '') {
        return value; // Mantém números sem aspas
    }
    return `'${value.toString().trim().replace(/'/g, "''")}'`; // Adiciona aspas em textos
}

// 🔹 Alternar modo escuro
function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    // Salvar preferência no localStorage
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
    } else {
        localStorage.setItem("theme", "light");
    }
}

// 🔹 Manter tema salvo ao recarregar a página
window.onload = function () {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
    }
};

// 🔹 Limpar os dados carregados
function clearFiles() {
    document.getElementById("insert-input").value = ""; // Limpa input INSERT
    document.getElementById("update-input").value = ""; // Limpa input UPDATE
    document.getElementById("insert-sql-links").innerHTML = ""; // Limpa a lista INSERT
    document.getElementById("update-sql-links").innerHTML = ""; // Limpa a lista UPDATE
}
