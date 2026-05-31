# -*- coding: utf-8 -*-
"""
Bắc Trung Hải Logistics - Zalo Client Filter Service
Extracts active merchant accounts based on their active Client ID (cid).
"""

def filter_active_merchants_by_cid(db_connection, active_cid):
    """
    Retrieves precise target merchants matching the active Client ID (cid).
    Enforces targeted customer messaging flows, bypassing generic lists.
    """
    if not active_cid:
        return []

    query = "SELECT id, name, phone, cid FROM users WHERE cid = %s AND role = 'CUSTOMER'"
    cursor = db_connection.cursor()
    cursor.execute(query, (active_cid,))
    results = cursor.fetchall()

    merchants = []
    for row in results:
        merchants.append({
            "id": row[0],
            "name": row[1],
            "phone": row[2],
            "cid": row[3]
        })
    return merchants
