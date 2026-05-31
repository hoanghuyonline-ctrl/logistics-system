# -*- coding: utf-8 -*-
"""
Bắc Trung Hải Logistics - CID Database Extraction Module
Provides target-locked queries filtered by Client ID (CID) matching registered user phone numbers.
"""

import json

def get_client_by_phone_with_cid(db_connection, phone_number):
    """
    Retrieves registered user with a valid Client ID (CID).
    Prevents generic sweeps by enforcing targeted query filters.
    """
    if not phone_number:
        return None
        
    query = "SELECT id, name, phone, cid, role FROM users WHERE phone = %s AND cid IS NOT NULL LIMIT 1"
    cursor = db_connection.cursor()
    cursor.execute(query, (phone_number,))
    row = cursor.fetchone()
    
    if not row:
        return None
        
    client_data = {
        "id": row[0],
        "name": row[1],
        "phone": row[2],
        "cid": row[3], # Strict Client ID mapping
        "role": row[4]
    }
    
    # Encapsulate payload safely into JSON for secure upstream transmission
    return json.dumps(client_data)
