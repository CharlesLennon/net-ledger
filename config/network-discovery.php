<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Network Discovery Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration options for the automated network discovery system
    |
    */

    // Default subnet to scan if none specified
    'default_subnet' => env('NETWORK_SCAN_SUBNET', '192.168.1.0/24'),

    // Default timeout for network operations (seconds)
    'default_timeout' => env('NETWORK_SCAN_TIMEOUT', 5),

    // Enable/disable automatic scheduling
    'auto_scan_enabled' => env('NETWORK_AUTO_SCAN_ENABLED', true),

    // Scan frequencies (in minutes)
    'scan_frequencies' => [
        'quick' => env('NETWORK_SCAN_QUICK_MINUTES', 15),      // Every 15 minutes
        'standard' => env('NETWORK_SCAN_STANDARD_MINUTES', 60), // Every hour
        'detailed' => env('NETWORK_SCAN_DETAILED_HOURS', 24),   // Every 24 hours
        'comprehensive' => env('NETWORK_SCAN_COMPREHENSIVE_DAYS', 7), // Every 7 days
    ],

    // Common ports to scan for services
    'service_ports' => [
        22 => 'SSH',
        23 => 'Telnet',
        25 => 'SMTP',
        53 => 'DNS',
        80 => 'HTTP',
        110 => 'POP3',
        143 => 'IMAP',
        443 => 'HTTPS',
        993 => 'IMAPS',
        995 => 'POP3S',
        3389 => 'RDP',
        5432 => 'PostgreSQL',
        3306 => 'MySQL',
        1433 => 'MSSQL',
        161 => 'SNMP',
        21 => 'FTP',
        873 => 'rsync',
        8080 => 'HTTP-Alt',
        8443 => 'HTTPS-Alt',
        2222 => 'SSH-Alt',
    ],

    // Discovery methods to use
    'discovery_methods' => [
        'ping' => true,
        'arp' => true,
        'port_scan' => true,
        'hostname_lookup' => true,
        'os_detection' => false, // Requires nmap
    ],

    // Logging configuration
    'logging' => [
        'enabled' => true,
        'level' => env('NETWORK_SCAN_LOG_LEVEL', 'info'),
        'separate_files' => true, // Use separate log files for different scan types
    ],

    // Email notifications for failed scans
    'notifications' => [
        'email_on_failure' => env('NETWORK_SCAN_EMAIL_ON_FAILURE', false),
        'admin_email' => env('NETWORK_SCAN_ADMIN_EMAIL', 'admin@example.com'),
    ],

    // Performance settings
    'performance' => [
        'max_concurrent_scans' => env('NETWORK_SCAN_MAX_CONCURRENT', 10),
        'scan_delay_ms' => env('NETWORK_SCAN_DELAY_MS', 100), // Delay between hosts
        'retry_attempts' => env('NETWORK_SCAN_RETRY_ATTEMPTS', 2),
    ],

    // Security settings
    'security' => [
        'allowed_subnets' => [
            '192.168.0.0/16',
            '10.0.0.0/8',
            '172.16.0.0/12',
            '127.0.0.0/8',
        ],
        'max_scan_range' => 20, // Maximum number of IPs to scan in one operation (reduced for performance)
    ],
];
