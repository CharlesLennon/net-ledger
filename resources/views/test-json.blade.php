<!DOCTYPE html>
<html>
<head>
    <title>JSON Test</title>
</head>
<body>
    <h1>JSON Data Test</h1>
    <div id="output"></div>

    <script>
        console.log('Testing JSON data...');
        
        // Test each data type individually
        try {
            const locations = @json($locations);
            console.log('Locations:', locations);
            document.getElementById('output').innerHTML += '<p>Locations: ' + JSON.stringify(locations) + '</p>';
        } catch (e) {
            console.error('Locations error:', e);
            document.getElementById('output').innerHTML += '<p style="color: red;">Locations error: ' + e.message + '</p>';
        }

        try {
            const devices = @json($devices);
            console.log('Devices:', devices);
            document.getElementById('output').innerHTML += '<p>Devices: ' + JSON.stringify(devices) + '</p>';
        } catch (e) {
            console.error('Devices error:', e);
            document.getElementById('output').innerHTML += '<p style="color: red;">Devices error: ' + e.message + '</p>';
        }

        try {
            const interfaces = @json($interfaces);
            console.log('Interfaces:', interfaces);
            document.getElementById('output').innerHTML += '<p>Interfaces: ' + JSON.stringify(interfaces) + '</p>';
        } catch (e) {
            console.error('Interfaces error:', e);
            document.getElementById('output').innerHTML += '<p style="color: red;">Interfaces error: ' + e.message + '</p>';
        }

        try {
            const connections = @json($connections);
            console.log('Connections:', connections);
            document.getElementById('output').innerHTML += '<p>Connections: ' + JSON.stringify(connections) + '</p>';
        } catch (e) {
            console.error('Connections error:', e);
            document.getElementById('output').innerHTML += '<p style="color: red;">Connections error: ' + e.message + '</p>';
        }

        try {
            const deviceIPs = @json($deviceIPs);
            console.log('DeviceIPs:', deviceIPs);
            document.getElementById('output').innerHTML += '<p>DeviceIPs: ' + JSON.stringify(deviceIPs) + '</p>';
        } catch (e) {
            console.error('DeviceIPs error:', e);
            document.getElementById('output').innerHTML += '<p style="color: red;">DeviceIPs error: ' + e.message + '</p>';
        }

        try {
            const services = @json($services);
            console.log('Services:', services);
            document.getElementById('output').innerHTML += '<p>Services: ' + JSON.stringify(services) + '</p>';
        } catch (e) {
            console.error('Services error:', e);
            document.getElementById('output').innerHTML += '<p style="color: red;">Services error: ' + e.message + '</p>';
        }
    </script>
</body>
</html>
