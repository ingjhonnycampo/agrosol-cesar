<?php
// Panel del profesor: ver notas de todos los estudiantes (protegido con clave)
session_start();
$c = require __DIR__ . '/config.php';
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');

if (isset($_GET['salir'])) { $_SESSION = []; session_destroy(); header('Location: resultados.php'); exit; }
$clave = $c['admin_clave'] ?? '';
if (isset($_POST['clave']) && $clave !== '' && hash_equals($clave, (string)$_POST['clave'])) { $_SESSION['prof'] = 1; header('Location: resultados.php'); exit; }
$ok = !empty($_SESSION['prof']);
$error = isset($_POST['clave']) && !$ok;

$filas = []; $err = '';
$vista = ($_GET['vista'] ?? 'todas') === 'mejor' ? 'mejor' : 'todas';
if ($ok) {
    try {
        $pdo = new PDO("mysql:host={$c['host']};dbname={$c['db']};charset=utf8mb4", $c['user'], $c['pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        if ($vista === 'mejor') {
            $sql = "SELECT p.nombre, p.modo, p.nota, p.aciertos, p.segundos, p.ayudas, p.creado,
                           (SELECT COUNT(*) FROM partidas x WHERE x.nombre = p.nombre) AS intentos
                    FROM partidas p
                    WHERE p.id = (SELECT x.id FROM partidas x WHERE x.nombre = p.nombre ORDER BY x.nota DESC, x.aciertos DESC, x.segundos ASC LIMIT 1)
                    ORDER BY p.nombre";
        } else {
            $sql = "SELECT nombre, modo, nota, aciertos, segundos, ayudas, creado, 1 AS intentos FROM partidas ORDER BY creado DESC";
        }
        $filas = $pdo->query($sql)->fetchAll();
    } catch (Throwable $e) { $err = $e->getMessage(); }

    if (isset($_GET['csv']) && !$err) {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="notas_' . $vista . '_' . date('Ymd_His') . '.csv"');
        echo "\xEF\xBB\xBF"; $o = fopen('php://output', 'w');
        fputcsv($o, ['Nombre', 'Reto', 'Nota', 'Aciertos', 'Segundos', 'Ayudas', 'Fecha', 'Intentos'], ';');
        foreach ($filas as $f) fputcsv($o, [$f['nombre'], $f['modo'], $f['nota'], $f['aciertos'], $f['segundos'], $f['ayudas'], $f['creado'], $f['intentos']], ';');
        exit;
    }
}
$notas = array_column($filas, 'nota');
?><!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notas · Panel del profesor</title>
<style>
body{font-family:"Segoe UI",system-ui,sans-serif;background:#0d0a33;color:#f2f0ff;margin:0;padding:20px}
.w{max-width:1000px;margin:0 auto}h1{color:#f5c542;margin:0 0 4px}
.card{background:#14216b88;border:2px solid #f5c54299;border-radius:14px;padding:16px;margin-top:14px}
input,button,a.b{padding:10px 14px;border-radius:8px;border:2px solid #1f3aa8;background:#0b1245;color:#fff;font-size:15px;text-decoration:none;cursor:pointer}
button,a.b{background:#f5c542;color:#2a1a00;border:0;font-weight:700}a.b.s{background:#26207a;color:#fff}
table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:7px 8px;border-bottom:1px solid #ffffff22;text-align:left}th{color:#ffdf8a}
td.n{font-weight:800;color:#f5c542;font-size:16px}.bar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0;align-items:center}
.st{display:flex;gap:10px;flex-wrap:wrap}.st div{background:#0b1245;border-radius:10px;padding:8px 14px}.st b{display:block;font-size:20px;color:#ffdf8a}
.err{background:#e5384f33;border:1px solid #e5384f;padding:8px 12px;border-radius:8px}
</style></head><body><div class="w">
<h1>📋 Notas de los estudiantes</h1>
<?php if (!$ok): ?>
  <div class="card"><form method="post"><p>Clave del profesor:</p>
    <input type="password" name="clave" autofocus required> <button>Entrar</button>
    <?php if ($error): ?><p class="err">Clave incorrecta.</p><?php endif; ?>
    <?php if ($clave === ''): ?><p class="err">Falta definir <code>admin_clave</code> en config.php.</p><?php endif; ?>
  </form></div>
<?php else: ?>
  <div class="bar">
    <a class="b <?= $vista === 'todas' ? '' : 's' ?>" href="?vista=todas">Todas las partidas</a>
    <a class="b <?= $vista === 'mejor' ? '' : 's' ?>" href="?vista=mejor">Mejor nota por estudiante</a>
    <a class="b s" href="?vista=<?= $vista ?>&csv=1">⬇ Descargar para Excel</a>
    <a class="b s" href="?salir=1">Salir</a>
  </div>
  <?php if ($err): ?><p class="err"><?= $h($err) ?></p><?php endif; ?>
  <div class="st">
    <div><b><?= count($filas) ?></b><?= $vista === 'mejor' ? 'estudiantes' : 'partidas' ?></div>
    <div><b><?= $notas ? round(array_sum($notas) / count($notas), 1) : 0 ?></b>promedio</div>
    <div><b><?= $notas ? max($notas) : 0 ?></b>nota máxima</div>
    <div><b><?= count(array_filter($notas, fn($n) => $n == 100)) ?></b>con 100</div>
  </div>
  <div class="card" style="overflow:auto"><table>
    <tr><th>Nombre</th><th>Reto</th><th>Nota</th><th>Aciertos</th><th>Tiempo</th><th>Ayudas</th><th><?= $vista === 'mejor' ? 'Intentos' : 'Fecha' ?></th></tr>
    <?php foreach ($filas as $f): ?>
      <tr><td><?= $h($f['nombre']) ?></td><td><?= $h($f['modo']) ?></td><td class="n"><?= (int)$f['nota'] ?></td>
        <td><?= (int)$f['aciertos'] ?>/14</td><td><?= floor($f['segundos'] / 60) ?>:<?= str_pad($f['segundos'] % 60, 2, '0', STR_PAD_LEFT) ?></td>
        <td><?= $h($f['ayudas'] ?: '—') ?></td><td><?= $vista === 'mejor' ? (int)$f['intentos'] : $h($f['creado']) ?></td></tr>
    <?php endforeach; if (!$filas): ?><tr><td colspan="7">Aún no hay partidas.</td></tr><?php endif; ?>
  </table></div>
<?php endif; ?>
</div></body></html>
