const adminUsersService = require("./admin-users.service");

class AdminUsersController {
  async getAdminUsers(req, res, next) {
    try {
      const admin_users = await adminUsersService.getAdminUsers();
      res.json({ success: true, admin_users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async saveAdminUser(req, res, next) {
    try {
      const result = await adminUsersService.saveAdminUser(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateAdminUser(req, res, next) {
    try {
      const result = await adminUsersService.updateAdminUser(req.params.id, req.body);
      res.json(result);
    } catch (err) {
      if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: err.message });
    }
  }

  async deleteAdminUser(req, res, next) {
    try {
      const result = await adminUsersService.deleteAdminUser(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new AdminUsersController();
