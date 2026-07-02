Add-Type -AssemblyName System.Drawing

$outPath = 'D:\b方案\流量主结算信息变更申明_个人打印版.png'
$dpi = 300
$width = 2480
$height = 3508
$marginLeft = 230
$marginRight = 230
$marginTop = 165
$marginBottom = 155
$contentWidth = $width - $marginLeft - $marginRight

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$bmp.SetResolution($dpi, $dpi)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$black = [System.Drawing.Brushes]::Black
$gray = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(135,135,135))
$pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 2)
$thinPen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 1.4)

$fontName = 'Microsoft YaHei'
$titleFont = New-Object System.Drawing.Font($fontName, 15, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
$bodyFont = New-Object System.Drawing.Font($fontName, 8.4, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$noteFont = New-Object System.Drawing.Font($fontName, 8.2, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$lineHeight = 46
$paraGap = 10

function Draw-CenteredText([string]$text, [System.Drawing.Font]$font, [int]$y) {
    $size = $g.MeasureString($text, $font)
    $x = ($width - $size.Width) / 2
    $g.DrawString($text, $font, $black, $x, $y)
}

function Wrap-Text([string]$text, [System.Drawing.Font]$font, [int]$maxWidth) {
    $lines = New-Object System.Collections.Generic.List[string]
    $line = ""
    foreach ($ch in $text.ToCharArray()) {
        $candidate = $line + $ch
        if ($g.MeasureString($candidate, $font).Width -le $maxWidth -or $line.Length -eq 0) {
            $line = $candidate
        } else {
            $lines.Add($line)
            $line = [string]$ch
        }
    }
    if ($line.Length -gt 0) { $lines.Add($line) }
    return $lines
}

function Draw-Paragraph([string]$text, [int]$y, [switch]$Indent, [System.Drawing.Font]$font = $bodyFont) {
    $indentPx = 0
        if ($Indent) { $indentPx = [int]$g.MeasureString('　　', $font).Width }
    $first = $true
    foreach ($line in (Wrap-Text $text $font ($contentWidth - $indentPx))) {
        $x = $marginLeft
        if ($first -and $Indent) { $x += $indentPx }
        $g.DrawString($line, $font, $black, $x, $y)
        $y += $lineHeight
        $first = $false
    }
    return $y + $paraGap
}

function Draw-BankTable([int]$y) {
    $tableX = $marginLeft
    $tableW = $contentWidth
    $labelW = 370
    $rowH = 74
    $rows = @('银行账户名', '银行账号', '开户银行', '开户行所在地')
    for ($i = 0; $i -le 4; $i++) {
        $yy = $y + $i * $rowH
        $g.DrawLine($pen, $tableX, $yy, $tableX + $tableW, $yy)
    }
    $g.DrawLine($pen, $tableX, $y, $tableX, $y + 4 * $rowH)
    $g.DrawLine($pen, $tableX + $labelW, $y, $tableX + $labelW, $y + 4 * $rowH)
    $g.DrawLine($pen, $tableX + $tableW, $y, $tableX + $tableW, $y + 4 * $rowH)
    for ($i = 0; $i -lt 4; $i++) {
        $g.DrawString($rows[$i], $bodyFont, $black, $tableX + 22, $y + $i * $rowH + 19)
    }
    return $y + 4 * $rowH + 28
}

function Draw-SignTable([int]$y) {
    $tableX = $marginLeft
    $tableW = $contentWidth
    $colW = [int]($tableW / 2)
    $row1 = 210
    $row2 = 54
    $row3 = 86
    $tableH = $row1 + $row2 + $row3
    $g.DrawRectangle($thinPen, $tableX, $y, $tableW, $tableH)
    $g.DrawLine($thinPen, $tableX + $colW, $y, $tableX + $colW, $y + $tableH)
    $g.DrawLine($thinPen, $tableX, $y + $row1, $tableX + $tableW, $y + $row1)
    $g.DrawLine($thinPen, $tableX, $y + $row1 + $row2, $tableX + $tableW, $y + $row1 + $row2)
    $g.DrawString('委托人（本人）', $bodyFont, $black, $tableX + 55, $y + 25)
    $g.DrawString('签名：', $bodyFont, $black, $tableX + 55, $y + 86)
    $g.DrawLine($thinPen, $tableX + 180, $y + 122, $tableX + $colW - 65, $y + 122)
    $g.DrawString('受托方', $bodyFont, $black, $tableX + $colW + 55, $y + 25)
    $g.DrawString('签名/盖章：', $bodyFont, $black, $tableX + $colW + 55, $y + 86)
    $g.DrawLine($thinPen, $tableX + $colW + 245, $y + 122, $tableX + $tableW - 65, $y + 122)
    $g.DrawString('日期：', $bodyFont, $black, $tableX + 55, $y + $row1 + $row2 + 25)
    $g.DrawLine($thinPen, $tableX + 160, $y + $row1 + $row2 + 58, $tableX + $colW - 65, $y + $row1 + $row2 + 58)
    $g.DrawString('日期：', $bodyFont, $black, $tableX + $colW + 55, $y + $row1 + $row2 + 25)
    $g.DrawLine($thinPen, $tableX + $colW + 160, $y + $row1 + $row2 + 58, $tableX + $tableW - 65, $y + $row1 + $row2 + 58)
    return $y + $tableH + 26
}

function Draw-FillLine([string]$label, [int]$x, [int]$y, [int]$w) {
    $g.DrawString($label, $bodyFont, $black, $x, $y)
    $labelW = [int]$g.MeasureString($label, $bodyFont).Width
    $g.DrawLine($thinPen, $x + $labelW + 12, $y + 34, $x + $w, $y + 34)
}

$y = $marginTop
Draw-CenteredText '变更申请' $titleFont $y
$y += 90
$g.DrawString('致腾讯公司：', $bodyFont, $black, $marginLeft, $y)
$y += 62

$g.DrawString('本人信息：', $bodyFont, $black, $marginLeft, $y)
$y += 50
Draw-FillLine '姓名：' $marginLeft $y ($marginLeft + 520)
Draw-FillLine '身份证号：' ($marginLeft + 610) $y ($marginLeft + $contentWidth)
$y += 70
Draw-FillLine '公众号/小程序帐号名称：' $marginLeft $y ($marginLeft + 900)
Draw-FillLine '原始ID或APPID：' ($marginLeft + 980) $y ($marginLeft + $contentWidth)
$y += 70

$p1 = '本人（以下简称“本人”）的微信公众号/微信小程序（以下简称“公众号/小程序”）已经成功申请使用“微信平台广告展示服务”（系统页面可能称“流量主服务”，以下亦称“广告展示服务”），本人已同意在使用广告展示服务的全过程中严格遵守与贵公司缔结的《微信平台广告展示服务协议》（以下亦称“服务协议”）全部条款。'
$p2 = '现根据自身业务需要，须委托第三方使用本人的公众号/小程序进行广告展示服务，本人已与受托方达成委托关系。受托方将自行与贵公司签订《微信平台广告展示服务协议》，并根据相关协议收取产生的所有流量主收益费用。故本人和受托方特共同申请贵公司自下方填写日期起至委托关系结束之日止（以下亦称“委托期间”），由受托方与贵公司结算展示收入。在委托期间，本人仅可委托一个受托方从事本申请所述事项；本人有权在委托期间解除对受托方的委托，具体以本人、受托方自行协商确定，并以本人重新向腾讯公司提出的变更申请为准，因此本人与原受托方存在任何争议的，与腾讯公司无关，由本人及受托方自行协商解决。'

$y = Draw-Paragraph $p1 $y -Indent
$g.DrawString('受托方信息：', $bodyFont, $black, $marginLeft, $y)
$y += 50
Draw-FillLine '姓名/名称：' $marginLeft $y ($marginLeft + 700)
Draw-FillLine '身份证号/信用代码：' ($marginLeft + 780) $y ($marginLeft + $contentWidth)
$y += 70
Draw-FillLine '委托开始日期：' $marginLeft $y ($marginLeft + 620)
$g.DrawString('年', $bodyFont, $black, $marginLeft + 645, $y)
$g.DrawLine($thinPen, $marginLeft + 700, $y + 34, $marginLeft + 800, $y + 34)
$g.DrawString('月', $bodyFont, $black, $marginLeft + 820, $y)
$y += 70
$y = Draw-Paragraph $p2 $y -Indent
$y = Draw-Paragraph '本人/本公司与受托方确认的变更收款银行账户如下：' $y -Indent
$y = Draw-BankTable $y
$y = Draw-Paragraph '本人/本公司与受托方共同承诺：' $y

$items = @(
    '1、受托方参与广告展示服务并收款的行为应与贵公司签署协议，受服务协议条款约束；',
    '2、本申请函自本人及受托方签名后生效，本申请函生效后，因受托方参与广告展示服务及广告款项结算问题而产生的一切后果，由受托方和本人共同承担连带责任。',
    '3、相关款项一经到达结算银行账户，则视为贵公司已经完整履行展示收入结算义务，本人或受托方均无权向贵公司主张相关债权。',
    '4. 本人与受托方的结算将另行约定，如有争议，与贵公司无关。',
    '5. 委托期间，贵公司与受托方结算，如受托方为企业单位，应由受托方向贵公司提供与结算金额等额的增值税专用发票；如受托方为自然人，由贵公司按照税法和主管税务机关的许可，代征和代扣代缴受托自然人的各项税费（包括个人所得税、增值税及附加），受托自然人的实收金额为结算金额扣减代扣代征各项税费后的剩余金额。'
)
foreach ($item in $items) {
    $y = Draw-Paragraph $item $y -Indent
}

$y += 2
$y = Draw-SignTable $y
$y = Draw-Paragraph '注1：个人须本人亲笔签字，企业须加盖企业公章或合同专用章。' $y -font $noteFont
$y = Draw-Paragraph '注2：受托方可在委托方合法授权下，签署本变更申请。受托方签署后，视同委托方和受托方一致确认。如有争议，与腾讯公司无关，由委托方和受托方沟通。' $y -font $noteFont

if ($y -gt ($height - $marginBottom)) {
    $g.DrawString('内容接近页面底部，建议打印时选择“适合页面”。', $noteFont, $gray, $marginLeft, $height - 60)
}

$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()

Write-Output $outPath
