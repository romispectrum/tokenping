import type { PrivacyMessages } from "./shared";

const ATTRIBUTION_QUESTION_ES = '"¿Cómo te enteraste de Tokenping?"';

export const MESSAGES: PrivacyMessages = {
  metaTitle: "Privacidad y datos",
  metaDescription:
    "Qué almacena Tokenping cuando configuras una alerta del factor de salud de Aave, qué no almacena, qué servicios tratan tus datos y cómo eliminarlos.",
  crumbHome: "Inicio",
  crumbPrivacy: "Privacidad",
  title: "Privacidad: qué almacena Tokenping y quién trata los datos",
  lastUpdated: "Actualizado el",
  intro:
    "Esta página describe lo que hace la aplicación hoy. Tokenping está en beta, y actualizamos esta página cuando cambia lo que recopilamos.",
  withoutUs: {
    title: "Lo que puedes hacer sin darnos nada",
    text: "Leer el sitio y el blog, y ver tus posiciones en el panel, no agrega nada a nuestra base de datos. Para mostrar tus posiciones, tu navegador pide a proveedores de RPC (indicados más abajo) los datos de Aave de tu billetera, así que ellos ven la dirección de tu billetera.",
    morpho:
      "En el panel de Morpho, tu navegador también envía la dirección de tu billetera a la API de Morpho, que encuentra los mercados de Morpho en los que pides prestado, y lee tus posiciones de Morpho de los mismos proveedores de RPC.",
  },
  stored: {
    title: "Lo que almacenamos cuando guardas una alerta",
    items: [
      "La dirección de tu billetera.",
      "La red a la que corresponde la alerta y tu umbral.",
      "Los canales que elegiste y el idioma de cada uno.",
      "Tu dirección de correo electrónico, si elegiste correo electrónico.",
      "Tu nombre de usuario de Signal, si elegiste Signal.",
      "Cuándo se creó la alerta y cuándo se modificó por última vez.",
      "Cuándo enviaste por última vez un mensaje de prueba en cada canal, para permitir una prueba por canal cada 15 minutos.",
    ],
    telegram:
      "Si eliges Telegram, almacenamos el nombre de usuario de Telegram que escribes en la alerta. Cuando esa cuenta pulsa Iniciar en el bot de Tokenping, también almacenamos el ID de su chat y cuándo pulsó Iniciar, para que las alertas puedan llegarle. Cualquiera puede comprobar si un nombre de usuario de Telegram ha pulsado Iniciar en el bot.",
    attribution: `Si respondes la pregunta opcional ${ATTRIBUTION_QUESTION_ES} después de guardar una alerta, almacenamos tu respuesta y la hora junto con la dirección de tu billetera.`,
  },
  notStored: {
    title: "Lo que no almacenamos",
    items: [
      "Tus posiciones ni un historial de tu factor de salud. Se leen en el momento y no se guardan.",
      "Un registro de las alertas que enviamos.",
      `Píxeles de seguimiento ni cookies publicitarias: el sitio no usa ninguno. Cuando inicias sesión con tu billetera, Tokenping establece una cookie que únicamente indica qué billetera inició sesión; dura 7 días o hasta que desconectes la billetera en este sitio. Mientras inicias sesión, una segunda cookie guarda la solicitud de inicio de sesión durante cinco minutos. Tu navegador guarda en su propio almacenamiento local (local storage) el tema que elegiste, la conexión de tu billetera, qué billeteras iniciaron sesión en él y si ya te mostró la pregunta ${ATTRIBUTION_QUESTION_ES}.`,
      "Direcciones IP en nuestra base de datos. Aun así, Vercel procesa cada solicitud, como se indica más abajo. Cuando falla una revisión de alertas o un mensaje, el error, que puede incluir la dirección de tu billetera y el destinatario, va a los registros de nuestro servidor.",
    ],
  },
  whoCanSee: {
    title: "Quién puede ver tu configuración de alertas",
    tiedToWallet:
      "La configuración de alertas está vinculada a una dirección de billetera, no a una cuenta con contraseña. Para verla o cambiarla, firmas un mensaje con esa billetera, lo que demuestra que la dirección es tuya. No es una transacción y no cuesta gas, y una firma dura 7 días en ese navegador.",
    anyone: hasTelegram =>
      `Solo alguien que pueda firmar con tu billetera puede ver la dirección de correo electrónico${hasTelegram ? ", el nombre de usuario de Signal y el nombre de usuario de Telegram" : " y el nombre de usuario de Signal"} guardados para ella, o cambiar o eliminar sus alertas. Aun así, los registros públicos de pagos descritos más abajo muestran qué billeteras han pagado.`,
    dontEnter:
      "No escribas una dirección de correo electrónico ni un nombre de usuario de Signal que no quieras que quede vinculado a la dirección de tu billetera.",
  },
  processors: {
    title: "Quién trata tus datos",
    list: ({ minutes, hasTelegram }) => [
      {
        name: "Vercel",
        role: `Aloja este sitio y ejecuta la revisión de alertas cada ${minutes} minutos.`,
        receives: "Cada solicitud al sitio, incluida tu dirección IP, y los registros de nuestro servidor.",
      },
      {
        name: "Vercel Web Analytics",
        role: "Cuenta las páginas vistas, sin cookies.",
        receives:
          "Por cada página vista: la dirección de la página, el sitio del que vienes, tu ubicación aproximada, y tu navegador, sistema operativo y tipo de dispositivo. Un visitante es un hash de la solicitud que cambia cada 24 horas, así que las visitas no se pueden vincular entre días ni entre sitios.",
      },
      { name: "Supabase", role: "Nuestra base de datos.", receives: "La configuración de alertas indicada arriba." },
      {
        name: "Resend",
        role: "Envía las alertas por correo electrónico.",
        receives: "Tu dirección de correo electrónico y el texto de la alerta.",
      },
      {
        name: "Fly.io (nuestro servidor de retransmisión de Signal)",
        role: "Aloja el servidor signal-cli-rest-api que operamos, que entrega las alertas de Signal a Signal.",
        receives: "Tu nombre de usuario de Signal y el texto de la alerta (que también recibe Signal).",
      },
      ...(hasTelegram
        ? [
            {
              name: "Telegram",
              role: "Entrega las alertas de Telegram a través de su Bot API.",
              receives: "El ID de tu chat de Telegram y el texto de la alerta.",
            },
          ]
        : []),
      {
        name: "Proveedores de RPC (PublicNode, Alchemy y los endpoints públicos de las redes)",
        role: "Responden las lecturas de la blockchain: desde tu navegador para el panel, y desde nuestro servidor para las revisiones de alertas y para verificar las firmas de inicio de sesión de billeteras inteligentes.",
        receives:
          "La dirección de billetera que se lee (y, cuando inicias sesión, tu firma), y tu dirección IP en las lecturas hechas desde tu navegador.",
      },
      {
        name: "API de Morpho",
        role: "Encuentra los mercados de Morpho listados en los que pide prestado tu billetera, para el panel de Morpho, y le indica a nuestro servidor si un mercado está listado cuando guardas una alerta de Morpho.",
        receives: "La dirección de tu billetera, y tu dirección IP en las consultas que hace tu navegador.",
      },
      {
        name: "WalletConnect",
        role: "Retransmite la conexión entre este sitio y la aplicación de tu billetera, si te conectas con WalletConnect.",
        receives:
          "Lo que la aplicación de tu billetera y este sitio intercambian para conectarse, como la dirección de tu billetera.",
      },
    ],
    receives: receives => `Recibe: ${receives}`,
    ownPolicy: "Cada uno de estos servicios trata esos datos según su propia política de privacidad.",
  },
  onChain: {
    title: "Lo que es público en la blockchain",
    text: paymentChainName =>
      `El pago de las alertas se hace en ${paymentChainName ? `la red ${paymentChainName}` : "la red de pago"}. Cada pago registra la dirección que paga, el token, el monto, la hora, el período comprado y la nueva fecha de expiración en un evento público que cualquiera puede leer y nadie puede borrar. Tu configuración de alertas nunca se escribe en una blockchain.`,
  },
  retention: {
    title: "Cuánto tiempo lo conservamos y cómo eliminarlo",
    settings:
      "La configuración de alertas se conserva hasta que eliminas la alerta en el panel. Eliminarla borra la configuración de esa red, incluidos la dirección de correo electrónico y el nombre de usuario de Signal, y requiere acceso activo.",
    telegramStop: "Enviar /stop al bot de Tokenping en Telegram desvincula tu chat y detiene las alertas de Telegram.",
    contact: {
      before: `Si tu acceso expiró, o quieres que eliminemos tu respuesta a la pregunta ${ATTRIBUTION_QUESTION_ES}, escríbenos en`,
      x: "X",
      middle: "o en nuestra comunidad en",
      telegram: "Telegram",
      or: "o",
      signal: "Signal",
      after: "y lo eliminaremos.",
    },
    payments: "Nadie puede eliminar los pagos en la blockchain.",
  },
  homepage: {
    before: "Las preguntas sobre cómo funcionan las alertas se responden en la ",
    link: "página de inicio",
    after: ".",
  },
};
