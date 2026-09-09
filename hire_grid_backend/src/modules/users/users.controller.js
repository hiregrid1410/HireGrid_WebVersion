const usersService = require("./users.service");

class UsersController {
  async getUsers(req, res, next) {
    try {
      const users = await usersService.getUsers(req.query);
      res.json({ success: true, users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await usersService.getUserById(req.params.id);
      res.json({ success: true, user });
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async updateUser(req, res, next) {
    const id = req.params.id || req.body.id;
    try {
      const result = await usersService.updateUser(id, req.body, req.user);
      res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await usersService.deleteUser(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getDeviceRequests(req, res, next) {
    try {
      const requests = await usersService.getDeviceRequests();
      res.json({ success: true, requests });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createDeviceRequest(req, res, next) {
    try {
      const result = await usersService.createDeviceRequest(req.body, req.user);
      res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async updateDeviceRequest(req, res, next) {
    try {
      const result = await usersService.updateDeviceRequest(req.params.id, req.body.status);
      res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new UsersController();
