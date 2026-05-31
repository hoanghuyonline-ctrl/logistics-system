# -*- coding: utf-8 -*-
"""
Bắc Trung Hải Logistics - Core Database Models
Binds the browser Client ID (cid) field with the registered user accounts.
"""

class UserModel:
    def __init__(self, user_id, name, phone, cid=None, role="CUSTOMER"):
        self.user_id = user_id
        self.name = name
        self.phone = phone
        self.cid = cid  # Encrypted Browser Client ID
        self.role = role

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "name": self.name,
            "phone": self.phone,
            "cid": self.cid,
            "role": self.role
        }
