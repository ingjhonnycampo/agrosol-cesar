<?php
// API del juego: registrar / progreso / ranking
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function db() {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = require __DIR__ . '/config.php';
    $opt = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
    try {
        // Hosting compartido: la base ya existe y no se puede crear desde PHP
        $pdo = new PDO("mysql:host={$c['host']};dbname={$c['db']};charset=utf8mb4", $c['user'], $c['pass'], $opt);
    } catch (PDOException $e) {
        if ($e->getCode() != 1049) throw $e; // 1049 = base inexistente (solo pasa en local)
        $pdo = new PDO("mysql:host={$c['host']};charset=utf8mb4", $c['user'], $c['pass'], $opt);
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$c['db']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        $pdo->exec("USE `{$c['db']}`");
    }
    $pdo->exec("CREATE TABLE IF NOT EXISTS partidas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(60) NOT NULL,
        modo VARCHAR(10) NOT NULL,
        nota INT NOT NULL DEFAULT 0,
        aciertos INT NOT NULL DEFAULT 0,
        ayudas VARCHAR(40) NOT NULL DEFAULT '',
        segundos INT NOT NULL DEFAULT 0,
        terminado TINYINT NOT NULL DEFAULT 0,
        detalle TEXT NULL,
        creado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        actualizado DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX (nota), INDEX (nombre)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    return $pdo;
}

try {
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
    $accion = $_GET['accion'] ?? ($in['accion'] ?? '');

    if ($accion === 'registrar') {
        $nombre = trim(preg_replace('/\s+/u', ' ', (string)($in['nombre'] ?? '')));
        $modo = in_array($in['modo'] ?? '', ['microbit', 'arduino', 'mixto'], true) ? $in['modo'] : 'mixto';
        if (mb_strlen($nombre) < 2 || mb_strlen($nombre) > 60) out(['ok' => false, 'error' => 'Nombre inválido'], 400);
        $st = db()->prepare("INSERT INTO partidas (nombre, modo) VALUES (?, ?)");
        $st->execute([$nombre, $modo]);
        out(['ok' => true, 'id' => (int)db()->lastInsertId()]);
    }

    if ($accion === 'progreso') {
        $id = (int)($in['id'] ?? 0);
        $nota = max(0, min(100, (int)($in['nota'] ?? 0)));
        $aciertos = max(0, min(14, (int)($in['aciertos'] ?? 0)));
        $ayudas = substr(preg_replace('/[^a-z0-9,]/', '', (string)($in['ayudas'] ?? '')), 0, 40);
        $seg = max(0, min(86400, (int)($in['segundos'] ?? 0)));
        $fin = !empty($in['terminado']) ? 1 : 0;
        $det = json_encode($in['detalle'] ?? [], JSON_UNESCAPED_UNICODE);
        if ($id <= 0) out(['ok' => false], 400);
        $st = db()->prepare("UPDATE partidas SET nota=?, aciertos=?, ayudas=?, segundos=?, terminado=?, detalle=? WHERE id=?");
        $st->execute([$nota, $aciertos, $ayudas, $seg, $fin, mb_substr($det, 0, 4000), $id]);
        out(['ok' => true]);
    }

    if ($accion === 'ranking') {
        $rows = db()->query("SELECT nombre, modo, nota, aciertos, segundos, terminado, DATE_FORMAT(creado,'%d/%m %H:%i') AS fecha
                             FROM partidas ORDER BY nota DESC, aciertos DESC, segundos ASC LIMIT 30")->fetchAll();
        out(['ok' => true, 'ranking' => $rows]);
    }

    out(['ok' => false, 'error' => 'Acción desconocida'], 400);
} catch (Throwable $e) {
    out(['ok' => false, 'error' => 'Error de base de datos: ' . $e->getMessage()], 500);
}
