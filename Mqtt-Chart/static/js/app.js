(function () {

  /*  Collapsible */
  var elem = document.querySelector('.collapsible.expandable');
  var instance = M.Collapsible.init(elem, {
    accordion: false
  });

  instance.open(0);
  
    const brokerInput = document.getElementById('broker');
    const portInput   = document.getElementById('port');
    const topicInput  = document.getElementById('topic');
  
    const saveButton    = document.getElementById('save');
    const connectButton = document.getElementById('connect');

    /* Criando o Gauge */
    function createGauge(name, label, min, max)
			{
				var config = 
				{
					size: 320,
					label: label,
					min: undefined != min ? min : 0,
					max: undefined != max ? max : 100,
					minorTicks: 5
				}
				
				var range = config.max - config.min;
				config.yellowZones = [{ from: config.min + range*0.75, to: config.min + range*0.9 }];
				config.redZones = [{ from: config.min + range*0.9, to: config.max }];
				
				gauge = new Gauge(name + "GaugeContainer", config);
				gauge.render();
			}
  
    createGauge("mosquitto", "Mosquitto");   

    /* json com configuracoes iniciais de conexao */
    let json = {
      broker: 'test.mosquitto.org',
      topic: 'RF/gauge/temperature',
      port: 8080
    };
  
    /* resgata as informações do localStorage caso existir */
    if ( JSON.parse(localStorage.getItem('mqtt')) ) {
      json = JSON.parse(localStorage.getItem('mqtt'));
    }
  
    const mqttConnect = () => {
      return new Paho.MQTT.Client(
        json.broker,
        parseInt(json.port),
        "RF-" + Date.now()
      );
    };
  
    const onConnectionLost = (responseObject) => {
      let errorMessage = responseObject.errorMessage;
      console.log("Status: " + errorMessage);
      //Materialize.toast(errorMessage, 2000);
      M.toast({html: 'errorMessage'});
  
    };
  
    const onMessageArrived = (message) => {
      let msg = message.payloadString;
      console.log(message.destinationName, ' -- ', msg);
  
      if ( msg > 100 ) {
        return false;
      }
      
      if ( msg == gaugeZD.data.values('temperature')[0] ) {
        return false;
      }
  
      // metodo responsável por atualizar o Gauge
      gaugeZD.load({
        columns: [
          ['temperature', msg]
        ]
      });

      gauge.redraw(msg);
  
    };
  
    /* Instancia o paho-mqtt */
    let mqtt              = mqttConnect();
    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;
  
  
    const onSuccess = () => {
      mqtt.subscribe(json.topic, { qos: 1 }); // Assina o Tópico
      //Materialize.toast('Conectado ao broker', 2000);
      M.toast({html:'Conectado ao broker'});
    };
  
    const onFailure = (message) => {
      console.log("Connection failed: " + message.errorMessage);
    };
  
    /* função de conexão */
    const connect = () => {
  
      /* define aos eventos de Conexão seus respectivos callbacks*/
      let options = {
        timeout: 3,
        onSuccess: onSuccess,
        onFailure: onFailure
      };
      
      mqtt.connect(options); // Conecta ao Broker MQTT
    };
  
    const save = () => {
      var broker, topic;
      broker = $('#broker').val();
      port   = $('#port').val();
      topic  = $('#topic').val();
  
      /* salva no localStorage os dados do formulário */
      localStorage.setItem("mqtt", JSON.stringify({ broker: broker, port: port, topic: topic }));
  
      return location.reload();
    };
  
    const init = () => {
      brokerInput.value = json.broker;
      portInput.value   = json.port;
      topicInput.value  = json.topic;
    };
  
    /* App */
    init();
  
    /* Eventos de configuração */
    saveButton.addEventListener('click', save);
    connectButton.addEventListener('click', connect);
  
  })();