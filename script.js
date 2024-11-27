function handleInsertFiles(event) {
    processFiles(event, 'INSERT');
}

function handleUpdateFiles(event) {
    processFiles(event, 'UPDATE');
}

function processFiles(event, mode) {
    const files = event.target.files;
    const sqlLinksContainer = document.getElementById('sql-links');
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

                    // Gera os comandos SQL com base no modo (INSERT ou UPDATE)
                    const sqlCommands = jsonData.map(row => {
                        if (mode === 'INSERT') {
                            // Gera comando INSERT
                            const values = columns.map(column => {
                                const value = row[column];
                                return value === undefined || value === '' ? 'NULL' : `'${value.toString().replace(/'/g, "''")}'`;
                            }).join(', ');

                            return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values});`;
                        } else if (mode === 'UPDATE') {
                            // Gera comando UPDATE
                            const setClauses = columns.map(column => {
                                const value = row[column];
                                const cleanedValue = value === undefined || value === '' ? 'NULL' : `'${value.toString().replace(/'/g, "''")}'`;
                                return `${column} = ${cleanedValue}`;
                            }).join(', ');

                            // Identifica uma coluna-chave para a cláusula WHERE (ajuste conforme necessário)
                            const keyColumn = columns[0]; // Aqui usamos a primeira coluna como chave
                            const keyValue = row[keyColumn];
                            if (keyValue === undefined || keyValue === '') {
                                throw new Error(`A coluna-chave "${keyColumn}" está vazia para algum registro.`);
                            }
                            const whereClause = `${keyColumn} = '${keyValue.toString().replace(/'/g, "''")}'`;

                            return `UPDATE ${tableName} SET ${setClauses} WHERE ${whereClause};`;
                        }
                    }).join('\n');

                    // Cria link para download do SQL
                    const blob = new Blob([sqlCommands], { type: 'text/plain' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${tableName}_${mode}.sql`;
                    link.innerText = `Download ${tableName}_${mode}.sql`;
                    link.classList.add('sql-link');
                    sqlLinksContainer.appendChild(link);
                });

                // Remove mensagem de processamento
                sqlLinksContainer.removeChild(processingMsg);
            } catch (error) {
                console.error(`Erro ao processar arquivo para ${mode}:`, error);
                // Exibe mensagem de erro
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

function clearFiles() {
    document.getElementById('insert-input').value = '';
    document.getElementById('update-input').value = '';
    document.getElementById('sql-links').innerHTML = '';
}
