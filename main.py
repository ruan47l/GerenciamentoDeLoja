from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
import sqlite3

app = Flask(__name__)
app.secret_key = 'minha_chave_secreta'


def conectar_db():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn

@app.route("/", methods=['GET','POST'])
def homepage():
  if request.method == "POST":
    usuario = request.form['usuario']
    senha = request.form['senha']

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute(
      "Select * From usuarios where usuario = ? AND senha = ? ",
      (usuario,senha)
    )
    user = cursor.fetchone()
    conn.close()
    
    if user:
      return redirect(url_for('dashbord'))
    
    else:
      return render_template(
        'homepage.html',
        erro='Usuário não cadastrado ou senha incorreta')
      

  return render_template('homepage.html')

@app.route('/dashbord')
def dashbord():
   return render_template('dashbord.html')

@app.route('/cadastrar', methods=['GET','POST'])
def cadastrar():
  if request.method == 'POST':
    usuario = request.form['usuario']
    senha = request.form['senha']

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute('Select * From usuarios Where usuario = ?',
    (usuario,)
    )

    usuario_existente = cursor.fetchone()

    if usuario_existente:
      conn.close()
      return render_template(
        'cadastrar.html',
        erro='usuario ja existe'
      )
    
    cursor.execute('Insert Into usuarios (usuario,senha) VALUES (?,?)', 
    (usuario,senha)
    )
    conn.commit()
    conn.close()

    return redirect(url_for('dashbord'))

  return render_template('cadastrar.html')

@app.route('/usuarios', methods=['GET'])
def usuarios():
  conn = conectar_db()
  cursor = conn.cursor()

  cursor.execute('Select * From usuarios')
  usuarios = cursor.fetchall()
  conn.close()

  return render_template('usuarios.html', usuarios=usuarios)


@app.route('/produtos', methods=['GET','POST'])
def produtos():
  conn = conectar_db()
  cursor = conn.cursor()

  if request.method == 'POST':
    produto = request.form['produto']
    preco = request.form['preco']
    codigo = request.form['codigo']
    vencimento = request.form['vencimento']
    estoqueLoja = request.form['estoqueLoja']
    estoqueMinimo = request.form['estoqueMinimo']

    cursor.execute('Select * From produtos Where produto = ?',
    (produto,))

    produto_existente = cursor.fetchone()

    if produto_existente:
      cursor.execute('SELECT * FROM produtos')
      produtos = cursor.fetchall()
      conn.close()
      return render_template(
        'produtos.html',
        produtos=produtos,
        erro='produto já existe'
      )

    cursor.execute('Insert Into produtos (produto,preco,codigo,vencimento,estoque_loja,estoque_minimo) VALUES (?,?,?,?,?,?)', 
    (produto,preco,codigo,vencimento,estoqueLoja,estoqueMinimo)
    )
    conn.commit()

  busca = request.args.get('q')

  if busca:
      cursor.execute(
        "SELECT * FROM produtos WHERE produto LIKE ?",
        (f"%{busca}%",)
      )
  else:
      cursor.execute('SELECT * FROM produtos')

  produtos = cursor.fetchall()
  conn.close()

  return render_template('produtos.html', produtos=produtos)

@app.route('/produtos/excluir/<int:id>', methods=['GET','POST'])
def excluir_produto(id):
    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute('DELETE FROM produtos WHERE id = ?', (id,))
    conn.commit()
    conn.close()

    return redirect(url_for('produtos'))

@app.route('/editar_produto', methods=['POST'])
def editar_produto():
    conn = conectar_db()
    cursor = conn.cursor()

    id = request.form['id']
    produto = request.form['ProdutoEdit']
    preco = request.form['PrecoEdit']
    codigo = request.form['codigoEdit']
    vencimento = request.form['vencimentoEdit']
    estoque_loja = request.form['estoqueLojaEdit']
    estoque_minimo = request.form['estoqueMinimoEdit']

    cursor.execute("""
            UPDATE produtos
            SET produto = ?, preco = ?, codigo = ?, vencimento = ?,
                estoque_loja = ?, estoque_minimo = ?
            WHERE id = ?
        """, (produto, preco, codigo, vencimento, estoque_loja, estoque_minimo, id))

    conn.commit()
    conn.close()

    return redirect(url_for('produtos'))

@app.route('/venda', methods=['GET', 'POST'])
def venda():
    return render_template('vendas.html')


@app.route('/api/preco-produto')
def preco_produto():
    produto = request.args.get('produto', '').strip()

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, preco FROM produtos WHERE produto = ?",
        (produto,)
    )

    resultado = cursor.fetchone()
    conn.close()

    if resultado:
        return jsonify({
            "id": resultado["id"],
            "preco": resultado["preco"]
        })
    else:
        return jsonify({})




@app.route('/rvv')
def rvv():
    conn = conectar_db()
    cursor = conn.cursor()

  
    cursor.execute("""
        SELECT rvv.*, produtos.produto
        FROM rvv
        JOIN produtos ON produtos.id = rvv.produto_id
        ORDER BY data DESC
    """)
    registros = cursor.fetchall()


    cursor.execute("SELECT id, produto FROM produtos ORDER BY produto")
    produtos_lista = cursor.fetchall()
    
    conn.close()
    return render_template('rvv.html', registros=registros, produtos_lista=produtos_lista)



@app.route('/adicionar_rvv_manual', methods=['POST'])
def adicionar_rvv_manual():
    data = request.form['data']
    produto_id = request.form['produto_id']
    tipo = request.form['tipo']
    quantidade = float(request.form['quantidade'])
    preco_unitario = float(request.form['preco_unitario'])
    total = quantidade * preco_unitario

    conn = conectar_db()
    cursor = conn.cursor()
    
  
    cursor.execute("""
        INSERT INTO rvv (data, produto_id, tipo, quantidade, preco_unitario, total)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (data, produto_id, tipo, quantidade, preco_unitario, total))
    
    cursor.execute("UPDATE produtos SET estoque_loja = estoque_loja - ? WHERE id = ?", (quantidade, produto_id))
    
    conn.commit()
    conn.close()
    
    return redirect(url_for('rvv'))


@app.route('/finalizar-venda', methods=['POST'])
def finalizar_venda():
    dados = request.json

    conn = conectar_db()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO vendas (total) VALUES (?)",
        (dados['total'],)
    )
    venda_id = cursor.lastrowid

    for item in dados['itens']:
        cursor.execute("""
            INSERT INTO rvv
            (produto_id, tipo, quantidade, preco_unitario, total)
            VALUES (?, 'VENDA', ?, ?, ?)
        """, (
            item['produto_id'],
            item['quantidade'],
            item['preco'],
            item['quantidade'] * item['preco']
        ))

        cursor.execute("""
            UPDATE produtos
            SET estoque_loja = estoque_loja - ?
            WHERE id = ?
        """, (item['quantidade'], item['produto_id']))

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})

if __name__ == '__main__':
  app.run(debug=True)