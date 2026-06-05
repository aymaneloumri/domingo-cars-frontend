const FtpDeploy = require('ftp-deploy')
const ftpDeploy = new FtpDeploy()

const config = {
  user: 'u163327563.domingocars.ma',
  password: process.env.FTP_PASSWORD,
  host: '92.113.28.27',
  port: 21,
  localRoot: __dirname + '/dist',
  remoteRoot: '/public_html/',
  include: ['*', '**/*', '.htaccess'],
  exclude: [],
  deleteRemote: false,
  forcePasv: true
}

ftpDeploy
  .deploy(config)
  .then(res => console.log('✅ Deploy finished:', res))
  .catch(err => console.error('❌ Deploy error:', err))
