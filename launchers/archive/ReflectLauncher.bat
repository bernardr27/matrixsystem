@echo off
:: REFLECT OS LAUNCHER - STABLE BOOTLOADER v5.3.1
setlocal
set "SCRIPT_PATH=%~f0"
:: Strip until the PowerShell logic starts and pipe
more +13 "%SCRIPT_PATH%" | powershell -NoProfile -ExecutionPolicy Bypass -Command "-"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Neural Interface failure. Check logs.
    pause
)
goto :EOF

# --- POWERSHELL LOGIC STARTS HERE ---
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$icoPath = "$env:USERPROFILE\Desktop\ReflectOS_Floating.ico"

[xml]$xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="REFLECT OS CONTROL" Height="620" Width="1000"
        WindowStartupLocation="CenterScreen" ResizeMode="CanMinimize"
        Background="#050510" Foreground="#ffffff">
    <Window.Resources>
        <Style TargetType="Button">
            <Setter Property="Background" Value="#151525"/>
            <Setter Property="Foreground" Value="#ffffff"/>
            <Setter Property="BorderBrush" Value="#333"/>
            <Setter Property="BorderThickness" Value="1"/>
            <Setter Property="Padding" Value="10,8"/>
            <Setter Property="Margin" Value="4"/>
            <Setter Property="FontFamily" Value="Consolas, Segoe UI"/>
            <Setter Property="FontSize" Value="12"/>
            <Setter Property="Template">
                <Setter.Value>
                    <ControlTemplate TargetType="Button">
                        <Border Name="Border" Background="{TemplateBinding Background}" 
                                BorderBrush="{TemplateBinding BorderBrush}" 
                                BorderThickness="{TemplateBinding BorderThickness}" 
                                CornerRadius="8">
                            <ContentPresenter HorizontalAlignment="Center" VerticalAlignment="Center"/>
                        </Border>
                        <ControlTemplate.Triggers>
                            <Trigger Property="IsMouseOver" Value="True">
                                <Setter TargetName="Border" Property="Background" Value="#252545"/>
                                <Setter Property="Cursor" Value="Hand"/>
                            </Trigger>
                            <Trigger Property="IsPressed" Value="True">
                                <Setter TargetName="Border" Property="Background" Value="#3b82f6"/>
                            </Trigger>
                        </ControlTemplate.Triggers>
                    </ControlTemplate>
                </Setter.Value>
            </Setter>
        </Style>
        <Style TargetType="ProgressBar">
            <Setter Property="Background" Value="#000"/>
            <Setter Property="Foreground" Value="#3b82f6"/>
            <Setter Property="BorderThickness" Value="0"/>
            <Setter Property="Height" Value="4"/>
        </Style>
    </Window.Resources>

    <Grid Margin="30">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/>
            <RowDefinition Height="*"/>
            <RowDefinition Height="Auto"/>
        </Grid.RowDefinitions>

        <Grid Grid.Row="0" Margin="0,0,0,30">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="Auto"/>
            </Grid.ColumnDefinitions>
            <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                <Border Width="12" Height="12" CornerRadius="6" Background="#3b82f6" Margin="0,0,15,0"/>
                <StackPanel>
                    <TextBlock Text="REFLECT OS" FontSize="24" FontWeight="Bold" Foreground="#fff"/>
                    <TextBlock Text="SYSTEM COMMAND" FontSize="10" Foreground="#3b82f6"/>
                </StackPanel>
            </StackPanel>
            
            <Border Grid.Column="1" Background="#111" CornerRadius="20" Padding="15,5" BorderBrush="#222" BorderThickness="1">
                <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
                    <TextBlock Text="AI ENGINE: " FontSize="10" Foreground="#666" VerticalAlignment="Center"/>
                <TextBlock Name="TextOllama" Text="..." FontSize="10" Foreground="#888" FontWeight="Bold" VerticalAlignment="Center"/>
                    <Ellipse Name="DotOllama" Width="8" Height="8" Fill="#444" Margin="8,0,0,0"/>
                </StackPanel>
            </Border>
        </Grid>

        <Grid Grid.Row="1">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
                <ColumnDefinition Width="*"/>
            </Grid.ColumnDefinitions>

            <!-- GHOST BACKEND -->
            <Border Grid.Column="0" Background="#0c0c12" CornerRadius="16" Margin="5" BorderBrush="#222" BorderThickness="1">
                <Grid>
                    <Grid.RowDefinitions><RowDefinition Height="Auto"/><RowDefinition Height="*"/><RowDefinition Height="Auto"/></Grid.RowDefinitions>
                    <Border Background="#1a0000" CornerRadius="16,16,0,0" Padding="15" BorderBrush="#330000" BorderThickness="0,0,0,1">
                        <TextBlock Text="GHOST CORE" FontWeight="Bold" Foreground="#ff6b6b" FontSize="11"/>
                    </Border>
                    <StackPanel Grid.Row="1" VerticalAlignment="Center" Margin="20">
                         <Border Name="StatusBackend" Background="#111" CornerRadius="8" Padding="15" Margin="0,0,0,15">
                            <TextBlock Name="TextBackend" Text="OFFLINE" Foreground="#444" HorizontalAlignment="Center" FontWeight="Bold" FontSize="14"/>
                        </Border>
                        <ProgressBar Name="ProgBackend" Value="0"/>
                    </StackPanel>
                    <Button Grid.Row="2" Name="BtnStartBackend" Content="INITIALIZE" Height="36" Margin="10,0,10,15" Background="#331111"/>
                    <Button Grid.Row="2" Name="BtnStopBackend" Content="TERMINATE" Background="#2a0000" Visibility="Collapsed" Height="36" Margin="10,0,10,15"/>
                </Grid>
            </Border>

            <!-- REFLECT OS -->
            <Border Grid.Column="1" Background="#0c0c12" CornerRadius="16" Margin="5" BorderBrush="#222" BorderThickness="1">
                <Grid>
                    <Grid.RowDefinitions><RowDefinition Height="Auto"/><RowDefinition Height="*"/><RowDefinition Height="Auto"/></Grid.RowDefinitions>
                    <Border Background="#000d1a" CornerRadius="16,16,0,0" Padding="15" BorderBrush="#001a33" BorderThickness="0,0,0,1">
                        <TextBlock Text="REFLECT OS" FontWeight="Bold" Foreground="#3b82f6" FontSize="11"/>
                    </Border>
                    <StackPanel Grid.Row="1" VerticalAlignment="Center" Margin="20">
                         <Border Name="StatusApp" Background="#111" CornerRadius="8" Padding="15" Margin="0,0,0,15">
                            <TextBlock Name="TextApp" Text="OFFLINE" Foreground="#444" HorizontalAlignment="Center" FontWeight="Bold" FontSize="14"/>
                        </Border>
                        <ProgressBar Name="ProgApp" Value="0"/>
                    </StackPanel>
                    <Button Grid.Row="2" Name="BtnStartApp" Content="LAUNCH" Height="36" Margin="10,0,10,15" Background="#001a33"/>
                    <Grid Grid.Row="2" Name="GridAppActive" Visibility="Collapsed" Margin="10,0,10,15">
                         <Grid.ColumnDefinitions><ColumnDefinition Width="2*"/><ColumnDefinition Width="*"/></Grid.ColumnDefinitions>
                         <Button Grid.Column="0" Name="BtnOpenApp" Content="OPEN ↗" Background="#3b82f6" FontWeight="Bold"/>
                         <Button Grid.Column="1" Name="BtnStopApp" Content="X" Background="#111" Margin="4,0,0,0"/>
                    </Grid>
                </Grid>
            </Border>

            <!-- GHOST COMMAND -->
            <Border Grid.Column="2" Background="#0c0c12" CornerRadius="16" Margin="5" BorderBrush="#222" BorderThickness="1">
                <Grid>
                    <Grid.RowDefinitions><RowDefinition Height="Auto"/><RowDefinition Height="*"/><RowDefinition Height="Auto"/></Grid.RowDefinitions>
                    <Border Background="#1a051a" CornerRadius="16,16,0,0" Padding="15" BorderBrush="#2a0a2e" BorderThickness="0,0,0,1">
                        <TextBlock Text="GHOST CMD" FontWeight="Bold" Foreground="#d946ef" FontSize="11"/>
                    </Border>
                    <StackPanel Grid.Row="1" VerticalAlignment="Center" Margin="20">
                         <Border Name="StatusGhost" Background="#111" CornerRadius="8" Padding="15" Margin="0,0,0,15">
                            <TextBlock Name="TextGhost" Text="OFFLINE" Foreground="#444" HorizontalAlignment="Center" FontWeight="Bold" FontSize="14"/>
                        </Border>
                        <ProgressBar Name="ProgGhost" Value="0"/>
                    </StackPanel>
                    <Button Grid.Row="2" Name="BtnStartGhost" Content="CONNECT" Height="36" Margin="10,0,10,15" Background="#1a051a"/>
                    <Grid Grid.Row="2" Name="GridGhostActive" Visibility="Collapsed" Margin="10,0,10,15">
                         <Grid.ColumnDefinitions><ColumnDefinition Width="2*"/><ColumnDefinition Width="*"/></Grid.ColumnDefinitions>
                         <Button Grid.Column="0" Name="BtnOpenGhost" Content="OPEN ↗" Background="#d946ef" FontWeight="Bold" Foreground="#000"/>
                         <Button Grid.Column="1" Name="BtnStopGhost" Content="X" Background="#111" Margin="4,0,0,0"/>
                    </Grid>
                </Grid>
            </Border>

            <!-- NEXUS -->
            <Border Grid.Column="3" Background="#0c0c12" CornerRadius="16" Margin="5" BorderBrush="#222" BorderThickness="1">
                <Grid>
                    <Grid.RowDefinitions><RowDefinition Height="Auto"/><RowDefinition Height="*"/><RowDefinition Height="Auto"/></Grid.RowDefinitions>
                    <Border Background="#051a1a" CornerRadius="16,16,0,0" Padding="15" BorderBrush="#0a2a2a" BorderThickness="0,0,0,1">
                        <TextBlock Text="NEXUS" FontWeight="Bold" Foreground="#22d3ee" FontSize="11"/>
                    </Border>
                    <StackPanel Grid.Row="1" VerticalAlignment="Center" Margin="20">
                         <Border Name="StatusNexus" Background="#111" CornerRadius="8" Padding="15" Margin="0,0,0,15">
                            <TextBlock Name="TextNexus" Text="OFFLINE" Foreground="#444" HorizontalAlignment="Center" FontWeight="Bold" FontSize="14"/>
                        </Border>
                        <ProgressBar Name="ProgNexus" Value="0"/>
                    </StackPanel>
                    <Button Grid.Row="2" Name="BtnStartNexus" Content="DEEP LINK" Height="36" Margin="10,0,10,15" Background="#0a2a2a"/>
                    <Grid Grid.Row="2" Name="GridNexusActive" Visibility="Collapsed" Margin="10,0,10,15">
                         <Grid.ColumnDefinitions><ColumnDefinition Width="2*"/><ColumnDefinition Width="*"/></Grid.ColumnDefinitions>
                         <Button Grid.Column="0" Name="BtnOpenNexus" Content="OPEN ↗" Background="#22d3ee" FontWeight="Bold" Foreground="#000"/>
                         <Button Grid.Column="1" Name="BtnStopNexus" Content="X" Background="#111" Margin="4,0,0,0"/>
                    </Grid>
                </Grid>
            </Border>
        </Grid>

        <Border Grid.Row="2" Margin="0,20,0,0" Background="#0c0c12" CornerRadius="12" Padding="20" BorderBrush="#222" BorderThickness="1">
            <Grid>
                <Grid.ColumnDefinitions><ColumnDefinition Width="Auto"/><ColumnDefinition Width="*"/><ColumnDefinition Width="Auto"/></Grid.ColumnDefinitions>
                <StackPanel Orientation="Horizontal">
                    <Button Name="BtnBootAll" Content="SEQUENTIAL STARTUP" Width="200" Height="40" Background="#ffffff" Foreground="#000" FontWeight="Bold" Margin="0,0,15,0"/>
                    <Button Name="BtnKillAll" Content="PURGE" Width="100" Height="40" Background="#331111" Foreground="#ff6b6b" Margin="0,0,15,0"/>
                    <Button Name="BtnHazard" Content="HAZARD" Width="100" Height="40" Background="#ff0000" Foreground="#000" FontWeight="Bold"/>
                </StackPanel>
                <TextBlock Name="StatusMsg" Grid.Column="1" Text="Ready." VerticalAlignment="Center" HorizontalAlignment="Center" Foreground="#666" FontFamily="Consolas"/>
                <Button Name="BtnRefresh" Grid.Column="2" Content="REFRESH" Width="100" Background="#111"/>
            </Grid>
        </Border>
    </Grid>
</Window>
"@

$notify = New-Object System.Windows.Forms.NotifyIcon
if (Test-Path $icoPath) { 
    $notify.Icon = [System.Drawing.Icon]::ExtractAssociatedIcon($icoPath) 
} else { 
    $notify.Icon = [System.Drawing.SystemIcons]::Application 
}
$notify.Text = "Reflect OS Launcher"
$notify.Visible = $true
$menu = New-Object System.Windows.Forms.ContextMenu
$menu.MenuItems.Add("Show Dashboard", { $window.Visibility = "Visible"; $window.Activate() }) | Out-Null
$menu.MenuItems.Add("-") | Out-Null
$menu.MenuItems.Add("Exit", { $notify.Visible = $false; $window.Close(); [System.Windows.Forms.Application]::Exit() }) | Out-Null
$notify.ContextMenu = $menu
$notify.Add_DoubleClick({ $window.Visibility = "Visible"; $window.Activate() })

$reader = (New-Object System.Xml.XmlNodeReader $xaml)
$window = [Windows.Markup.XamlReader]::Load($reader)

function Get-Ctrl ($name) { return $window.FindName($name) }
$TextOllama = Get-Ctrl "TextOllama"; $DotOllama = Get-Ctrl "DotOllama"
$TextBackend = Get-Ctrl "TextBackend"; $ProgBackend = Get-Ctrl "ProgBackend"; $BtnStartBackend = Get-Ctrl "BtnStartBackend"; $BtnStopBackend = Get-Ctrl "BtnStopBackend"
$TextApp = Get-Ctrl "TextApp"; $ProgApp = Get-Ctrl "ProgApp"; $BtnStartApp = Get-Ctrl "BtnStartApp"; $GridAppActive = Get-Ctrl "GridAppActive"; $BtnStopApp = Get-Ctrl "BtnStopApp"; $BtnOpenApp = Get-Ctrl "BtnOpenApp"
$TextGhost = Get-Ctrl "TextGhost"; $ProgGhost = Get-Ctrl "ProgGhost"; $BtnStartGhost = Get-Ctrl "BtnStartGhost"; $GridGhostActive = Get-Ctrl "GridGhostActive"; $BtnStopGhost = Get-Ctrl "BtnStopGhost"; $BtnOpenGhost = Get-Ctrl "BtnOpenGhost"
$TextNexus = Get-Ctrl "TextNexus"; $ProgNexus = Get-Ctrl "ProgNexus"; $BtnStartNexus = Get-Ctrl "BtnStartNexus"; $GridNexusActive = Get-Ctrl "GridNexusActive"; $BtnStopNexus = Get-Ctrl "BtnStopNexus"; $BtnOpenNexus = Get-Ctrl "BtnOpenNexus"
$BtnBootAll = Get-Ctrl "BtnBootAll"; $BtnKillAll = Get-Ctrl "BtnKillAll"; $StatusMsg = Get-Ctrl "StatusMsg"; $BtnRefresh = Get-Ctrl "BtnRefresh"; $BtnHazard = Get-Ctrl "BtnHazard"

$script:Booting = @{}

function Purge-Service ($title) {
    Write-Host "[SYS] Purging conflicting instances of $title..." -ForegroundColor Cyan
    $procs = Get-Process | Where-Object { $_.MainWindowTitle -like "*$title*" }
    foreach ($p in $procs) {
        try {
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            Write-Host "[SYS] Terminated duplicate $title (PID: $($p.Id))" -ForegroundColor Gray
        } catch {}
    }
}

function Update-UI {
    # AI Engine
    $p = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue
    if ($p) { 
        $TextOllama.Text = "ONLINE"; $TextOllama.Foreground = "#10b981"; $DotOllama.Fill = "#10b981" 
    } else { 
        $TextOllama.Text = "OFFLINE"; $TextOllama.Foreground = "#444"; $DotOllama.Fill = "#222" 
    }
    
    # Ghost Core
    $b = Get-WmiObject Win32_Process | Where-Object { $_.CommandLine -like "*ghost-runner.cjs*" }
    if ($b) {
        $TextBackend.Text = "ONLINE"; $TextBackend.Foreground = "#ff6b6b"; $ProgBackend.Value = 100; $ProgBackend.IsIndeterminate = $false
        $BtnStartBackend.Visibility = "Collapsed"; $BtnStopBackend.Visibility = "Visible"
    } elseif ($script:Booting["Backend"]) { 
        $TextBackend.Text = "IGNITION..."; $ProgBackend.IsIndeterminate = $true 
        $BtnStartBackend.Visibility = "Visible"; $BtnStopBackend.Visibility = "Collapsed"
    } else { 
        $TextBackend.Text = "OFFLINE"; $TextBackend.Foreground = "#444"; $ProgBackend.Value = 0; $ProgBackend.IsIndeterminate = $false
        $BtnStartBackend.Visibility = "Visible"; $BtnStopBackend.Visibility = "Collapsed" 
    }
    
    # Reflect OS
    $p3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
    if ($p3000) {
        $TextApp.Text = "ONLINE"; $TextApp.Foreground = "#3b82f6"; $ProgApp.Value = 100; $ProgApp.IsIndeterminate = $false
        $BtnStartApp.Visibility = "Collapsed"; $GridAppActive.Visibility = "Visible"
    } elseif ($script:Booting["App"]) { 
        $TextApp.Text = "BOOTING..."; $ProgApp.IsIndeterminate = $true 
        $BtnStartApp.Visibility = "Visible"; $GridAppActive.Visibility = "Collapsed"
    } else { 
        $TextApp.Text = "OFFLINE"; $TextApp.Foreground = "#444"; $ProgApp.Value = 0; $ProgApp.IsIndeterminate = $false
        $BtnStartApp.Visibility = "Visible"; $GridAppActive.Visibility = "Collapsed" 
    }
    
    # Ghost Command
    $p5173 = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
    if ($p5173) {
        $TextGhost.Text = "ONLINE"; $TextGhost.Foreground = "#d946ef"; $ProgGhost.Value = 100; $ProgGhost.IsIndeterminate = $false
        $BtnStartGhost.Visibility = "Collapsed"; $GridGhostActive.Visibility = "Visible"
    } elseif ($script:Booting["Ghost"]) { 
        $TextGhost.Text = "SYNCING..."; $ProgGhost.IsIndeterminate = $true 
        $BtnStartGhost.Visibility = "Visible"; $GridGhostActive.Visibility = "Collapsed"
    } else { 
        $TextGhost.Text = "OFFLINE"; $TextGhost.Foreground = "#444"; $ProgGhost.Value = 0; $ProgGhost.IsIndeterminate = $false
        $BtnStartGhost.Visibility = "Visible"; $GridGhostActive.Visibility = "Collapsed" 
    }

    # Nexus
    $p3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
    if ($p3001) {
        $TextNexus.Text = "ONLINE"; $TextNexus.Foreground = "#22d3ee"; $ProgNexus.Value = 100; $ProgNexus.IsIndeterminate = $false
        $BtnStartNexus.Visibility = "Collapsed"; $GridNexusActive.Visibility = "Visible"
    } elseif ($script:Booting["Nexus"]) { 
        $TextNexus.Text = "LINKING..."; $ProgNexus.IsIndeterminate = $true 
        $BtnStartNexus.Visibility = "Visible"; $GridNexusActive.Visibility = "Collapsed"
    } else { 
        $TextNexus.Text = "OFFLINE"; $TextNexus.Foreground = "#444"; $ProgNexus.Value = 0; $ProgNexus.IsIndeterminate = $false
        $BtnStartNexus.Visibility = "Visible"; $GridNexusActive.Visibility = "Collapsed" 
    }
}

$BtnStartBackend.Add_Click({ 
    Purge-Service "GHOST_RUNNER"; 
    $script:Booting["Backend"] = $true; 
    Start-Process cmd -ArgumentList "/k title SENTINEL_GUARD && cd /d `"%~dp0..`" && node core\sentinel.cjs" -WindowStyle Minimized;
    Start-Sleep -Seconds 1;
    Start-Process cmd -ArgumentList "/k title GHOST_RUNNER && cd /d `"%~dp0..`" && node core\ghost-runner.cjs" -WindowStyle Minimized; 
    Update-UI 
})
$BtnStopBackend.Add_Click({ Start-Process taskkill -ArgumentList "/F /FI `"WINDOWTITLE eq GHOST_RUNNER*`" /IM cmd.exe" -WindowStyle Hidden; $script:Booting["Backend"] = $false; Start-Sleep -Seconds 1; Update-UI })

$BtnStartApp.Add_Click({ Purge-Service "REFLECT_OS"; $script:Booting["App"] = $true; Start-Process cmd -ArgumentList "/k title REFLECT_OS && cd /d `"%~dp0..\apps\reflect`" && npm.cmd run dev" -WindowStyle Minimized; Update-UI })
$BtnStopApp.Add_Click({ Start-Process taskkill -ArgumentList "/F /FI `"WINDOWTITLE eq REFLECT_OS*`" /IM cmd.exe" -WindowStyle Hidden; $script:Booting["App"] = $false; Start-Sleep -Seconds 1; Update-UI })
$BtnOpenApp.Add_Click({ Start-Process "http://localhost:3000" })

$BtnStartGhost.Add_Click({ Purge-Service "GHOST_OS"; $script:Booting["Ghost"] = $true; Start-Process cmd -ArgumentList "/k title GHOST_OS && cd /d `"%~dp0..\apps\ghost-command`" && npm.cmd run dev" -WindowStyle Minimized; Update-UI })
$BtnStopGhost.Add_Click({ Start-Process taskkill -ArgumentList "/F /FI `"WINDOWTITLE eq GHOST_OS*`" /IM cmd.exe" -WindowStyle Hidden; $script:Booting["Ghost"] = $false; Start-Sleep -Seconds 1; Update-UI })
$BtnOpenGhost.Add_Click({ Start-Process "http://localhost:5173" })

$BtnStartNexus.Add_Click({ Purge-Service "NEXUS_HUB"; $script:Booting["Nexus"] = $true; Start-Process cmd -ArgumentList "/k title NEXUS_HUB && cd /d `"%~dp0..\apps\nexus`" && npm.cmd run dev -- --port 3001" -WindowStyle Minimized; Update-UI })
$BtnStopNexus.Add_Click({ Start-Process taskkill -ArgumentList "/F /FI `"WINDOWTITLE eq NEXUS_HUB*`" /IM cmd.exe" -WindowStyle Hidden; $script:Booting["Nexus"] = $false; Start-Sleep -Seconds 1; Update-UI })
$BtnOpenNexus.Add_Click({ Start-Process "http://localhost:3001" })

$BtnRefresh.Add_Click({ Update-UI })

$BtnKillAll.Add_Click({ 
    $timer.Stop()
    Start-Process taskkill -ArgumentList "/F /IM node.exe /T" -WindowStyle Hidden
    Start-Process taskkill -ArgumentList "/F /IM cmd.exe /FI `"WINDOWTITLE eq REFLECT*`"" -WindowStyle Hidden
    Start-Process taskkill -ArgumentList "/F /IM cmd.exe /FI `"WINDOWTITLE eq GHOST*`"" -WindowStyle Hidden
    Start-Process taskkill -ArgumentList "/F /IM cmd.exe /FI `"WINDOWTITLE eq NEXUS*`"" -WindowStyle Hidden
    Start-Process taskkill -ArgumentList "/F /IM cmd.exe /FI `"WINDOWTITLE eq SENTINEL*`"" -WindowStyle Hidden
    $script:Booting = @{}
    Start-Sleep -Seconds 2
    Update-UI
    $timer.Start() 
})

$BtnHazard.Add_Click({
    $timer.Stop()
    $StatusMsg.Text = "!! HAZARD PURGE INITIATED !!"
    $StatusMsg.Foreground = "#ff0000"
    
    # Total Purge
    Start-Process taskkill -ArgumentList "/F /IM node.exe /T" -WindowStyle Hidden
    Start-Process taskkill -ArgumentList "/F /IM cmd.exe /FI `"WINDOWTITLE eq REFLECT*`"" -WindowStyle Hidden
    Start-Process taskkill -ArgumentList "/F /IM cmd.exe /FI `"WINDOWTITLE eq GHOST*`"" -WindowStyle Hidden
    Start-Process taskkill -ArgumentList "/F /IM cmd.exe /FI `"WINDOWTITLE eq NEXUS*`"" -WindowStyle Hidden
    
    $script:Booting = @{}
    Start-Sleep -Seconds 3
    Update-UI
    $StatusMsg.Text = "System Purged."
    $StatusMsg.Foreground = "#666"
    $timer.Start()
})

function Ensure-Service ($title, $cmd, $port=$null) {
    if (-not (Get-Process | Where-Object { $_.MainWindowTitle -like "*$title*" })) {
        if ($port) {
            $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($conns) {
                Write-Host "[IGNITION] Purging Zombie on Port $port..." -ForegroundColor Yellow
                $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
                foreach ($p in $pids) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }
            }
        }
        Write-Host "[IGNITION] Launching $title..." -ForegroundColor Cyan
        Start-Process cmd -ArgumentList "/k title $title && cd /d `"%~dp0..`" && $cmd" -WindowStyle Minimized
    } else {
        Write-Host "[SKIP] $title is already active." -ForegroundColor Gray
    }
}

$BtnBootAll.Add_Click({ 
    $script:Booting["Backend"] = $true
    
    Ensure-Service "SENTINEL_GUARD" "node core\sentinel.cjs"
    Start-Sleep -Seconds 1
    Ensure-Service "GHOST_RUNNER" "node core\ghost-runner.cjs"
    
    Start-Sleep -Seconds 2
    $script:Booting["App"] = $true
    # For sub-apps, we need fully qualified paths in the command
    Ensure-Service "REFLECT_OS" "cd apps\reflect && npm.cmd run dev" 3000
    
    $script:Booting["Ghost"] = $true
    Ensure-Service "GHOST_OS" "cd apps\ghost-command && npm.cmd run dev" 5173
    
    $script:Booting["Nexus"] = $true
    Ensure-Service "NEXUS_HUB" "cd apps\nexus && npm.cmd run dev -- --port 3001" 3001
    
    Update-UI
})

$window.Add_StateChanged({ 
    if ($window.WindowState -eq "Minimized") { 
        $window.Visibility = "Hidden" 
    } 
})

$window.Add_Closed({ $notify.Visible = $false })

$timer = New-Object System.Windows.Threading.DispatcherTimer
$timer.Interval = [TimeSpan]::FromSeconds(2)
$timer.Add_Tick({ Update-UI })
$timer.Start()

Update-UI
$window.ShowDialog() | Out-Null
