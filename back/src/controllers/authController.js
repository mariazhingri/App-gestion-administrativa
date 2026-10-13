import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { password } = req.body;

    if (password !== process.env.LOGIN_PASSWORD) {
      return res.status(401).json({
        message: 'contraseña incorrecta'
      });
    }

 
    const token = jwt.sign({},process.env.JWT_SECRET,{ expiresIn: '24h'});

    return res.status(200).json({
      message: 'Login exitoso',
      token
    });

  } catch (error) {
    console.error('Error en login:', error);

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};